import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get("/", (req, res) => res.send("MCP Node Server Running 🚀"));

app.post("/tool/chat-query", async (req, res) => {
  const { message } = req.body;
  const msg = message.toLowerCase();

  try {
    // Extract student name
    let studentName = "";
    const match = msg.match(/(rahim|karim|ayesha)/i);
    if (match) studentName = match[1];

    // 👉 ALL STUDENTS
    if (msg.includes("all student")) {
      return res.json({
        message: "All Students: Rahim, Karim, Ayesha",
      });
    }

    // 👉 STUDENT RELATED → Python API
    if (studentName) {
      const pyRes = await fetch("http://127.0.0.1:6000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_name: studentName }),
      });

      const data = await pyRes.json();

      if (data.error) {
        return res.json({ message: data.error });
      }

      // CGPA
      if (msg.includes("cgpa")) {
        return res.json({
          message: `Student: ${data.name}
Predicted CGPA: ${data.predicted_cgpa}
Needed CGPA: ${data.needed_cgpa}`,
        });
      }

      // Weak subjects
      if (msg.includes("weak") || msg.includes("focus")) {
        return res.json({
          message:
            data.weak_subjects.length > 0
              ? `Student: ${data.name} should focus on: ${data.weak_subjects.join(", ")}`
              : `Student: ${data.name} has no weak subjects 👍`,
        });
      }

      // Needed CGPA
      if (msg.includes("how much") || msg.includes("needed")) {
        return res.json({
          message:
            data.needed_cgpa > 0
              ? `Student ${data.name} needs ${data.needed_cgpa} more CGPA`
              : `Student ${data.name} already reached target CGPA`,
        });
      }
    }
    // 👉 GENERAL QUESTION → GEMINI AI 🔥
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      },
    );

    const geminiData = await geminiRes.json();

    console.log("Gemini Response:", geminiData); // DEBUG

    const aiText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI could not respond.";

    return res.json({ message: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => console.log(`MCP Node Server running on port ${PORT}`));
