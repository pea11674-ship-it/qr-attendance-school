"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ScanForm() {
  const params = useSearchParams();
  const [secretCode, setSecretCode] = useState("");
  const [result, setResult] = useState<any>(null);

  async function checkIn(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: params.get("session"), token: params.get("token"), secretCode })
    });
    setResult(await res.json());
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={checkIn}>
        <h1 className="page-title">Student Scan</h1>
        <p className="subtitle">ระบบจะใช้บัญชีนักเรียนที่ล็อกอินอยู่เท่านั้น ห้ามกรอกชื่อแทนกัน</p>
        <div className="field" style={{ marginTop: 18 }}>
          <label>รหัสลับประจำคาบ ถ้ามี</label>
          <input className="input" inputMode="numeric" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} />
        </div>
        <button className="btn" style={{ marginTop: 12 }}>เช็กชื่อเข้าเรียน</button>
        {result ? <div className="notice" style={{ marginTop: 14 }}><strong>{result.message}</strong><br />{result.status ? `สถานะ: ${result.status}` : ""}<br />{result.subject ? `รายวิชา: ${result.subject}` : ""}</div> : null}
      </form>
    </div>
  );
}

export default function ScanPage() {
  return <Suspense><ScanForm /></Suspense>;
}
