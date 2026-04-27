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
    console.log("User:", message);
    console.log("Python URL:", PYTHON_URL);

    const pyRes = await fetch(PYTHON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    console.log("Python status:", pyRes.status);

    let pyData;

    try {
      pyData = await pyRes.json();
    } catch (e) {
      console.error("Python JSON error");
      pyData = { message: "NOT_STUDENT_QUERY" };
    }

    if (pyData?.message && pyData.message !== "NOT_STUDENT_QUERY") {
      return res.json({ message: pyData.message });
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `User: ${message}` }],
          },
        ],
      }),
    });

    const geminiData = await geminiRes.json();

    let aiText = "AI could not respond.";

    if (geminiData?.candidates?.length > 0) {
      aiText = geminiData.candidates[0].content.parts
        .map((p) => p.text)
        .join(" ");
    }

    return res.json({ message: aiText });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/tool/semester-chart", async (req, res) => {
  const { message } = req.body;
  try {
    const pyRes = await fetch(`${process.env.PYTHON_API_URL}/semester` || "http://127.0.0.1:6000/semester", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await pyRes.json();
    return res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 MCP Server running on port ${PORT}`)
);