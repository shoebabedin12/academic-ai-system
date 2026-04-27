"use client"
import { useState } from "react";

interface Subject {
  name: string;
  marks: string;
}

interface Semester {
  semester: string;
  cgpa: string;
}

export default function AdminPage() {
  const [name, setName] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: "", marks: "" }
  ]);
  const [semesters, setSemesters] = useState<Semester[]>([
    { semester: "1", cgpa: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Subject add/remove
  const addSubject = () => setSubjects([...subjects, { name: "", marks: "" }]);
  const removeSubject = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, field: string, val: string) => {
    const updated = [...subjects];
    updated[i] = { ...updated[i], [field]: val };
    setSubjects(updated);
  };

  // ✅ Semester add/remove
  const addSemester = () => setSemesters([...semesters, { semester: String(semesters.length + 1), cgpa: "" }]);
  const removeSemester = (i: number) => setSemesters(semesters.filter((_, idx) => idx !== i));
  const updateSemester = (i: number, field: string, val: string) => {
    const updated = [...semesters];
    updated[i] = { ...updated[i], [field]: val };
    setSemesters(updated);
  };

  // ✅ Submit
  const handleSubmit = async () => {
    if (!name || !cgpa) {
      setMessage("❌ Name এবং CGPA দিন!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/add-student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            cgpa: parseFloat(cgpa),
            subjects: subjects
              .filter(s => s.name && s.marks)
              .map(s => ({ name: s.name, marks: parseInt(s.marks) })),
            semesters: semesters
              .filter(s => s.cgpa)
              .map(s => ({ semester: parseInt(s.semester), cgpa: parseFloat(s.cgpa) }))
          })
        }
      );

      const data = await res.json();
      setMessage(data.message);

      // ✅ Reset form
      if (res.ok) {
        setName("");
        setCgpa("");
        setSubjects([{ name: "", marks: "" }]);
        setSemesters([{ semester: "1", cgpa: "" }]);
      }

    } catch {
      setMessage("❌ Server error!");
    }

    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: "600px",
      margin: "40px auto",
      fontFamily: "Inter, sans-serif",
      padding: "0 16px"
    }}>
      {/* HEADER */}
      <div style={{
        background: "#4cbe7f",
        color: "#fff",
        padding: "16px 20px",
        borderRadius: "12px 12px 0 0",
        fontWeight: "700",
        fontSize: "18px"
      }}>
        🎓 Add New Student
      </div>

      <div style={{
        border: "1px solid #e5e7eb",
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        padding: "24px",
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }}>

        {/* NAME */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Student Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Arif Hossain"
            style={inputStyle}
          />
        </div>

        {/* CGPA */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Current CGPA</label>
          <input
            value={cgpa}
            onChange={e => setCgpa(e.target.value)}
            placeholder="e.g. 3.25"
            type="number"
            step="0.01"
            min="0"
            max="4"
            style={inputStyle}
          />
        </div>

        {/* SUBJECTS */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <label style={labelStyle}>📚 Subjects & Marks</label>
            <button onClick={addSubject} style={addBtnStyle}>+ Add</button>
          </div>

          {subjects.map((sub, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                value={sub.name}
                onChange={e => updateSubject(i, "name", e.target.value)}
                placeholder="Subject name"
                style={{ ...inputStyle, flex: 2, marginBottom: 0 }}
              />
              <input
                value={sub.marks}
                onChange={e => updateSubject(i, "marks", e.target.value)}
                placeholder="Marks"
                type="number"
                min="0"
                max="100"
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
              />
              {subjects.length > 1 && (
                <button
                  onClick={() => removeSubject(i)}
                  style={removeBtnStyle}
                >✕</button>
              )}
            </div>
          ))}
        </div>

        {/* SEMESTERS */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <label style={labelStyle}>📈 Semester Results</label>
            <button onClick={addSemester} style={addBtnStyle}>+ Add</button>
          </div>

          {semesters.map((sem, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <span style={{ color: "#666", fontSize: "14px", minWidth: "80px" }}>
                Semester {sem.semester}
              </span>
              <input
                value={sem.cgpa}
                onChange={e => updateSemester(i, "cgpa", e.target.value)}
                placeholder="CGPA (e.g. 3.20)"
                type="number"
                step="0.01"
                min="0"
                max="4"
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
              />
              {semesters.length > 1 && (
                <button
                  onClick={() => removeSemester(i)}
                  style={removeBtnStyle}
                >✕</button>
              )}
            </div>
          ))}
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: message.startsWith("❌") ? "#fee2e2" : "#dcfce7",
            color: message.startsWith("❌") ? "#dc2626" : "#16a34a",
            fontSize: "14px"
          }}>
            {message}
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#a3e4c1" : "#4cbe7f",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Adding..." : "✅ Add Student"}
        </button>

        {/* Back to chat */}
        <a href="/" style={{
          display: "block",
          textAlign: "center",
          marginTop: "12px",
          color: "#4cbe7f",
          fontSize: "14px",
          textDecoration: "none"
        }}>
          ← Back to Chat
        </a>
      </div>
    </div>
  );
}

// Styles
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "6px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  color: "#111",
  outline: "none",
  boxSizing: "border-box"
};

const addBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: "6px",
  border: "1px solid #4cbe7f",
  background: "#fff",
  color: "#4cbe7f",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600"
};

const removeBtnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#fee2e2",
  color: "#dc2626",
  cursor: "pointer",
  fontSize: "12px"
};