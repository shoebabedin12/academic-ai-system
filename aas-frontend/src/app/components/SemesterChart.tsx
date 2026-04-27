/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";

interface Props {
  studentName: string;
  semesters?: { semester: number; cgpa: number }[];
}

export default function SemesterChart({ studentName, semesters = [] }: Props) {
 if (!semesters.length) return null;

  
  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #e5e7eb",
      marginTop: "16px"
    }}>
      <h3 style={{ color: "#4cbe7f", marginBottom: "12px" }}>
        📊 {studentName} — Semester CGPA Trend
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={semesters}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="semester" label={{ value: "Semester", position: "insideBottom", offset: -2 }} />
          <YAxis domain={[0, 4]} />
          <Tooltip formatter={(val) => [`${val}`, "CGPA"]} />
          <ReferenceLine y={3.5} stroke="red" strokeDasharray="4 4" label="Target 3.5" />
          <Line type="monotone" dataKey="cgpa" stroke="#4cbe7f" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}