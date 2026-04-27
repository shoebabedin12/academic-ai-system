"use client"
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import SemesterChart from "./SemesterChart";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [chartStudent, setChartStudent] = useState("");
  const [chartSemesters, setChartSemesters] = useState([]);



  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chat_messages");
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { sender: "bot", text: "Hi! Ask me about students: CGPA, weak subjects, or all students." }
      ]);
    }
  }, []);

  // Save messages & scroll
  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));

    if (autoScroll && chatContainerRef.current) {
      // Scroll to bottom
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
    setAutoScroll(isAtBottom);
  };

  // Typing animation
  const typeMessage = (text: string, callback: () => void) => {
    let i = 0;
    let temp = "";

    // Add placeholder bot message
    setMessages(prev => [...prev, { sender: "bot", text: "" }]);

    const interval = setInterval(() => {
      temp += text[i];
      i++;

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = temp;
        return newMsgs;
      });

      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }

      if (i >= text.length) {
        clearInterval(interval);
        callback();
      }
    }, 15);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/tool/chat-query` || "http://localhost:5000/tool/chat-query";
    console.log("API URL:", url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      if (data.student && data.semesters) {
        setChartStudent(data.student);
        setChartSemesters(data.semesters);
      }

      // Start typing animation for bot
      typeMessage(data.message, () => setLoading(false));

    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "Server error. Please try again." }]);
      setLoading(false);
    }

    setInput("");
  };



  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const clearChat = () => {
    localStorage.removeItem("chat_messages");
    setMessages([{ sender: "bot", text: "Chat cleared. Ask again 😊" }]);
  };

  return (
    <div style={{
      minWidth: "700px",
      maxWidth: "700px",
      margin: "40px auto",
      fontFamily: "Inter, sans-serif",
      display: "flex",
      flexDirection: "column",
      height: "80vh",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
    }}>
      {/* HEADER */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        fontWeight: "600",
        background: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        color: "#4cbe7f"
      }}>
        🎓 Academic AI Assistant
        <button onClick={clearChat} style={{
          fontSize: "12px",
          border: "none",
          background: "#eee",
          padding: "4px 8px",
          borderRadius: "6px",
          cursor: "pointer"
        }}>
          Clear
        </button>
      </div>

      {/* CHAT BODY */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          background: "#f9fafb"
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px"
            }}
          >
            <div style={{
              padding: "10px 14px",
              borderRadius: "14px",
              maxWidth: "75%",
              background: msg.sender === "user" ? "#4cbe7f" : "#ffffff",
              color: msg.sender === "user" ? "#fff" : "#111",
              border: msg.sender === "bot" ? "1px solid #e5e7eb" : "none",
              whiteSpace: "pre-line",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
            }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "12px"
          }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "14px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              display: "flex",
              gap: "6px"
            }}>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>

              <style jsx>{`
        .dot {
          width: 6px;
          height: 6px;
          background: #999;
          border-radius: 50%;
          animation: blink 1.4s infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `}</style>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{
        display: "flex",
        padding: "12px",
        borderTop: "1px solid #eee",
        background: "#fff",
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            outline: "none",
            color: "#111"
          }}
          disabled={loading}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: "10px",
            padding: "0 18px",
            borderRadius: "10px",
            border: "none",
            background: "#4cbe7f",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
      {chartStudent && (
        <SemesterChart studentName={chartStudent} semesters={chartSemesters} />
      )}
    </div>
  );
}