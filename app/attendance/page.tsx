"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ subjectId: "", periodLabel: "คาบเรียนที่ 1", qrTtlSeconds: 60, presentWindowMinutes: 15, lateWindowMinutes: 15, secretEnabled: false });

  async function load() {
    const [subjectRes, sessionRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/attendance/sessions")]);
    if (subjectRes.ok) {
      const data = await subjectRes.json();
      setSubjects(data.subjects);
      setForm((prev: any) => ({ ...prev, subjectId: prev.subjectId || data.subjects[0]?.id || "" }));
    }
    if (sessionRes.ok) setSessions((await sessionRes.json()).sessions);
  }
  useEffect(() => { load(); }, []);

  async function startSession(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/attendance/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return alert(data.message);
    setActive(data);
    setRecords(data.session.records);
    load();
  }

  async function refreshRecords(sessionId = active?.session?.id) {
    if (!sessionId) return;
    const res = await fetch(`/api/attendance/records?sessionId=${sessionId}`);
    if (res.ok) setRecords((await res.json()).records);
  }

  async function editRecord(record: any) {
    const status = prompt("สถานะใหม่: PRESENT, LATE, ABSENT, LEAVE", record.status);
    if (!status) return;
    const reason = prompt("เหตุผลในการแก้ไข");
    const res = await fetch("/api/attendance/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: record.id, status, reason }) });
    if (!res.ok) alert((await res.json()).message);
    refreshRecords(record.sessionId);
  }

  return (
    <AppShell>
      <PageHeader title="Attendance Session" subtitle="เริ่มรอบเช็กชื่อ สร้าง QR Code หมดอายุเร็ว และดูผลแบบเรียลไทม์" actions={<button className="btn secondary" onClick={() => refreshRecords()}>รีเฟรชรายชื่อ</button>} />
      <section className="panel">
        <form className="form-grid" onSubmit={startSession}>
          <div className="field"><label>รายวิชา</label><select className="select" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} {subject.name} - {subject.classroom.name}</option>)}</select></div>
          <div className="field"><label>คาบเรียน</label><input className="input" value={form.periodLabel} onChange={(e) => setForm({ ...form, periodLabel: e.target.value })} /></div>
          <div className="field"><label>อายุ QR (วินาที)</label><select className="select" value={form.qrTtlSeconds} onChange={(e) => setForm({ ...form, qrTtlSeconds: Number(e.target.value) })}><option value={30}>30</option><option value={60}>60</option><option value={120}>120</option></select></div>
          <div className="field"><label>ช่วงมาเรียน (นาที)</label><input className="input" type="number" value={form.presentWindowMinutes} onChange={(e) => setForm({ ...form, presentWindowMinutes: Number(e.target.value) })} /></div>
          <div className="field"><label>ช่วงมาสาย (นาที)</label><input className="input" type="number" value={form.lateWindowMinutes} onChange={(e) => setForm({ ...form, lateWindowMinutes: Number(e.target.value) })} /></div>
          <div className="field"><label>รหัสลับ</label><select className="select" value={String(form.secretEnabled)} onChange={(e) => setForm({ ...form, secretEnabled: e.target.value === "true" })}><option value="false">ปิด</option><option value="true">เปิด</option></select></div>
          <button className="btn">เริ่มเช็กชื่อ</button>
        </form>
      </section>

      {active ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="qr-box">
            <img src={active.qrDataUrl} width={240} height={240} alt="QR Code สำหรับเช็กชื่อ" />
            <strong>{active.session.subject.name} {active.session.subject.classroom.name}</strong>
            <span>หมดอายุ: {new Date(active.session.qrExpiresAt).toLocaleTimeString("th-TH")}</span>
            {active.secretCode ? <span className="badge warn">รหัสลับ {active.secretCode}</span> : null}
            <a className="btn secondary" href={active.scanUrl} target="_blank">เปิดหน้าสแกน</a>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>รายชื่อในคาบ</h2>
        <div className="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>สถานะ</th><th>เวลา</th><th>หมายเหตุ</th><th>แก้ไข</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td>{record.student.studentCode}</td><td>{record.student.firstName} {record.student.lastName}</td><td><StatusBadge status={record.status} /></td><td>{record.checkedInAt ? new Date(record.checkedInAt).toLocaleString("th-TH") : "-"}</td><td>{record.note || "-"}</td><td><button className="btn secondary" onClick={() => editRecord(record)}>แก้สถานะ</button></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>รอบเช็กชื่อล่าสุด</h2>
        <div className="table-wrap"><table><thead><tr><th>วันที่</th><th>รายวิชา</th><th>ห้อง</th><th>สถานะ</th><th>ดูรายชื่อ</th></tr></thead>
          <tbody>{sessions.map((session) => <tr key={session.id}><td>{new Date(session.sessionDate).toLocaleDateString("th-TH")}</td><td>{session.subject.name}</td><td>{session.subject.classroom.name}</td><td>{session.status}</td><td><button className="btn secondary" onClick={() => { setActive({ session }); refreshRecords(session.id); }}>เปิด</button></td></tr>)}</tbody>
        </table></div>
      </section>
    </AppShell>
  );
}
