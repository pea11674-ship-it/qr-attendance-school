"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    fetch("/api/attendance/sessions").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setSessionId(data.sessions[0]?.id || "");
      }
    });
  }, []);

  const query = sessionId ? `?sessionId=${sessionId}&` : "?";

  return (
    <AppShell>
      <PageHeader title="Attendance Reports" subtitle="รายงานรายวัน รายวิชา รายห้อง และรายงานทางวิชาการ" />
      <section className="panel">
        <div className="form-grid">
          <div className="field">
            <label>เลือกรอบเช็กชื่อ</label>
            <select className="select" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.map((session) => <option key={session.id} value={session.id}>{new Date(session.sessionDate).toLocaleDateString("th-TH")} {session.subject.name} {session.subject.classroom.name}</option>)}
            </select>
          </div>
          <div className="actions" style={{ alignItems: "end" }}>
            <a className="btn" href={`/api/reports/export${query}format=excel`}>Export Excel</a>
            <a className="btn warning" href={`/api/reports/export${query}format=pdf`}>Export PDF</a>
          </div>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>รูปแบบรายงานที่รองรับ</h2>
        <div className="grid cards">
          <div className="card">รายงานเช็กชื่อรายวัน<br /><span className="subtitle">วันที่ รายวิชา ห้องเรียน ครู รายชื่อนักเรียน สถานะ เวลา หมายเหตุ</span></div>
          <div className="card">รายงานรายวิชา<br /><span className="subtitle">สรุปมาเรียน มาสาย ขาดเรียน และลา ของนักเรียนแต่ละคน</span></div>
          <div className="card">รายงานรายห้อง<br /><span className="subtitle">สรุปรวมทุกวิชาหรือเลือกเฉพาะรายวิชา</span></div>
          <div className="card">รายงานเกินเกณฑ์<br /><span className="subtitle">แสดงนักเรียนกลุ่มเสี่ยงตามเกณฑ์โรงเรียน</span></div>
        </div>
      </section>
    </AppShell>
  );
}
