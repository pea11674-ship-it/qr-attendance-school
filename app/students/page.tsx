"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ studentCode: "", firstName: "", lastName: "", level: "ม.1", classroomId: "" });

  async function load() {
    const [studentRes, metaRes] = await Promise.all([fetch("/api/students"), fetch("/api/meta")]);
    if (studentRes.ok) setStudents((await studentRes.json()).students);
    if (metaRes.ok) {
      const meta = await metaRes.json();
      setClassrooms(meta.classrooms);
      setForm((prev: any) => ({ ...prev, classroomId: prev.classroomId || meta.classrooms[0]?.id || "" }));
    }
  }

  useEffect(() => { load(); }, []);

  async function createStudent(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ studentCode: "", firstName: "", lastName: "", level: "ม.1", classroomId: classrooms[0]?.id || "" });
      load();
    } else alert((await res.json()).message);
  }

  return (
    <AppShell>
      <PageHeader title="Student Management" subtitle="จัดการรายชื่อนักเรียน ค้นหาและแยกตามห้องเรียน" />
      <section className="panel">
        <h2>เพิ่มนักเรียน</h2>
        <form className="form-grid" onSubmit={createStudent}>
          <div className="field"><label>รหัสนักเรียน</label><input className="input" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} required /></div>
          <div className="field"><label>คำนำหน้า</label><input className="input" value={form.prefix || ""} onChange={(e) => setForm({ ...form, prefix: e.target.value })} /></div>
          <div className="field"><label>ชื่อ</label><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div className="field"><label>นามสกุล</label><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          <div className="field"><label>ระดับชั้น</label><input className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required /></div>
          <div className="field"><label>ห้องเรียน</label><select className="select" value={form.classroomId} onChange={(e) => setForm({ ...form, classroomId: e.target.value })}>{classrooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div>
          <div className="field"><label>เลขที่</label><input className="input" type="number" value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
          <div className="field"><label>อีเมล/ชื่อผู้ใช้</label><input className="input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <button className="btn">บันทึกนักเรียน</button>
        </form>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>รหัส</th><th>เลขที่</th><th>ชื่อ-นามสกุล</th><th>ห้อง</th><th>อีเมล</th><th>โทรศัพท์</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.studentCode}</td>
                  <td>{student.number || "-"}</td>
                  <td>{student.prefix || ""}{student.firstName} {student.lastName}</td>
                  <td>{student.classroom.name}</td>
                  <td>{student.email || "-"}</td>
                  <td>{student.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
