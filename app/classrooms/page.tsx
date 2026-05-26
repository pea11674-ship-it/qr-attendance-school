"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [form, setForm] = useState({ level: "ม.1", room: "", name: "" });

  async function load() {
    const res = await fetch("/api/classrooms");
    if (res.ok) setClassrooms((await res.json()).classrooms);
  }
  useEffect(() => { load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/classrooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ level: "ม.1", room: "", name: "" });
      load();
    } else alert((await res.json()).message);
  }

  return (
    <AppShell>
      <PageHeader title="Classroom Management" subtitle="จัดการระดับชั้นและห้องเรียน" />
      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <div className="field"><label>ระดับชั้น</label><input className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
          <div className="field"><label>ห้อง</label><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} required /></div>
          <div className="field"><label>ชื่อห้อง</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ม.1/1" /></div>
          <button className="btn">เพิ่มห้องเรียน</button>
        </form>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="table-wrap">
          <table><thead><tr><th>ระดับชั้น</th><th>ห้อง</th><th>ชื่อห้อง</th><th>นักเรียน</th><th>รายวิชา</th></tr></thead>
            <tbody>{classrooms.map((room) => <tr key={room.id}><td>{room.level}</td><td>{room.room}</td><td>{room.name}</td><td>{room._count.students}</td><td>{room._count.subjects}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
