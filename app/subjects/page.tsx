"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ teachers: [], classrooms: [], academicYears: [], semesters: [] });
  const [form, setForm] = useState<any>({ code: "", name: "", dayOfWeek: 1, startsAt: "09:00", endsAt: "10:00" });

  async function load() {
    const [subjectRes, metaRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/meta")]);
    if (subjectRes.ok) setSubjects((await subjectRes.json()).subjects);
    if (metaRes.ok) {
      const data = await metaRes.json();
      setMeta(data);
      setForm((prev: any) => ({
        ...prev,
        teacherId: prev.teacherId || data.teachers[0]?.id,
        classroomId: prev.classroomId || data.classrooms[0]?.id,
        academicYearId: prev.academicYearId || data.academicYears[0]?.id,
        semesterId: prev.semesterId || data.semesters[0]?.id
      }));
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ ...form, code: "", name: "" });
      load();
    } else alert((await res.json()).message);
  }

  return (
    <AppShell>
      <PageHeader title="Subject Management" subtitle="จัดการรายวิชาและผูกรายวิชากับครูและห้องเรียน" />
      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          <div className="field"><label>รหัสวิชา</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div className="field"><label>ชื่อวิชา</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label>ครูผู้สอน</label><select className="select" value={form.teacherId || ""} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>{meta.teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select></div>
          <div className="field"><label>ห้องเรียน</label><select className="select" value={form.classroomId || ""} onChange={(e) => setForm({ ...form, classroomId: e.target.value })}>{meta.classrooms.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>วันเรียน</label><select className="select" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>{["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"].map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
          <div className="field"><label>เวลาเริ่ม</label><input className="input" type="time" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
          <div className="field"><label>เวลาจบ</label><input className="input" type="time" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          <div className="field"><label>ปีการศึกษา</label><select className="select" value={form.academicYearId || ""} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>{meta.academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.year}</option>)}</select></div>
          <div className="field"><label>ภาคเรียน</label><select className="select" value={form.semesterId || ""} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>{meta.semesters.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <button className="btn">บันทึกรายวิชา</button>
        </form>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="table-wrap"><table><thead><tr><th>รหัส</th><th>รายวิชา</th><th>ครู</th><th>ห้อง</th><th>วันเวลา</th><th>ภาคเรียน</th></tr></thead>
          <tbody>{subjects.map((subject) => <tr key={subject.id}><td>{subject.code}</td><td>{subject.name}</td><td>{subject.teacher.user.name}</td><td>{subject.classroom.name}</td><td>{subject.dayOfWeek} {subject.startsAt}-{subject.endsAt}</td><td>{subject.semester.name}/{subject.academicYear.year}</td></tr>)}</tbody>
        </table></div>
      </section>
    </AppShell>
  );
}
