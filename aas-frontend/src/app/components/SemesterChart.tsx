"use client"
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";

export default function SemesterChart({ studentName }: { studentName: string }) {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentName) return;
    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tool/semester-chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: studentName }),
    })
      .then(r => r.json())
      .then(d => {
        setName(d.student);
        setData(d.semesters || []);
        setLoading(false);
      });
  }, [studentName]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading chart...</p>;
  if (!data.length) return null;

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #e5e7eb",
      marginTop: "16px"
    }}>
      <h3 style={{ color: "#4cbe7f", marginBottom: "12px" }}>
        📊 {name} — Semester CGPA Trend
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="semester"
            label={{ value: "Semester", position: "insideBottom", offset: -2 }}
          />
          <YAxis domain={[0, 4]} />
          <Tooltip formatter={(val) => [`${val}`, "CGPA"]} />
          <ReferenceLine y={3.5} stroke="red" strokeDasharray="4 4" label="Target 3.5" />
          <Line
            type="monotone"
            dataKey="cgpa"
            stroke="#4cbe7f"
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}