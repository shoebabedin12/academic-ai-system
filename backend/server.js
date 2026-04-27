import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const PYTHON_URL = process.env.PYTHON_API_URL
  ? `${process.env.PYTHON_API_URL}/chat`
  : "http://127.0.0.1:6000/chat";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

app.post("/tool/chat-query", async (req, res) => {
  const { message } = req.body;

  try {
    // ✅ Step 1: Gemini দিয়ে intent বোঝো
    const intentRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
You are an academic assistant intent detector.
Analyze the user message and return ONLY a JSON object. No extra text.

User message: "${message}"

Return this exact format:
{
  "intent": "all_students" | "student_result" | "student_cgpa" | "weak_subjects" | "semester_chart" | "all_results" | "general",
  "student_name": "name or null",
  "extra": "any extra info or null"
}

Examples:
- "show me all students" → intent: "all_students"
- "Rahim er result" → intent: "student_result", student_name: "Rahim"
- "who is weak in math" → intent: "weak_subjects"  
- "Karim semester chart" → intent: "semester_chart", student_name: "Karim"
- "all student result" → intent: "all_results"
- "what is 2+2" → intent: "general"
            `
          }]
        }]
      })
    });

    const intentData = await intentRes.json();
    let intentText = intentData.candidates[0].content.parts.map(p => p.text).join("");
    
    // JSON parse করুন
    intentText = intentText.replace(/```json|```/g, "").trim();
    const intent = JSON.parse(intentText);

    console.log("Detected intent:", intent);

    // ✅ Step 2: Intent অনুযায়ী Python Flask এ call করো
    let pyEndpoint = "/chat";
    let pyMessage = message;

    if (intent.intent === "semester_chart") {
      pyEndpoint = "/semester";
      pyMessage = intent.student_name || message;
    }

    const pyRes = await fetch(`${process.env.PYTHON_API_URL}${pyEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: pyMessage,
        intent: intent.intent,
        student_name: intent.student_name
      }),
    });

    const pyData = await pyRes.json();

    // ✅ Semester chart data
    if (pyData.semesters) {
      return res.json({
        message: `📊 ${pyData.student} এর semester chart নিচে দেখুন`,
        student: pyData.student,
        semesters: pyData.semesters
      });
    }

    // ✅ Student data পেলে return করো
    if (pyData?.message && pyData.message !== "NOT_STUDENT_QUERY") {
      return res.json({ message: pyData.message });
    }

    // ✅ General question — Gemini দিয়ে উত্তর দাও
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });
    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates[0].content.parts.map(p => p.text).join(" ");
    
    return res.json({ message: aiText });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/tool/semester-chart", async (req, res) => {
  const { message } = req.body;
  try {
    const pyRes = await fetch(
      `${process.env.PYTHON_API_URL}/semester` ||
        "http://127.0.0.1:6000/semester",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      },
    );
    const data = await pyRes.json();
    return res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/admin/add-student", async (req, res) => {
  try {
    const pyRes = await fetch(
      `${process.env.PYTHON_API_URL}/admin/add-student`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const data = await pyRes.json();
    res.status(pyRes.ok ? 200 : 500).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.listen(PORT, () => console.log(`🚀 MCP Server running on port ${PORT}`));
