"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  const [form, setForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(async (res) => {
      if (res.ok) setForm((await res.json()).settings || {});
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm((await res.json()).settings);
      setSaved(true);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="ตั้งค่า QR Code ช่วงเวลาเช็กชื่อ เกณฑ์มาสายและขาดเรียน" />
      <section className="panel">
        <form className="form-grid" onSubmit={submit}>
          {[
            ["qrTtlSeconds", "อายุ QR Code (วินาที)"],
            ["presentWindowMinutes", "ช่วงมาเรียน (นาที)"],
            ["lateWindowMinutes", "ช่วงผ่อนผันมาสาย (นาที)"],
            ["warningAbsenceCount", "ขาดเกินกี่ครั้ง = เฝ้าระวัง"],
            ["criticalAbsenceCount", "ขาดเกินกี่ครั้ง = เกินเกณฑ์"],
            ["lateToAbsenceRatio", "มาสายกี่ครั้ง = ขาด 1 ครั้ง"],
            ["minimumAttendancePercent", "เวลาเรียนขั้นต่ำ (%)"]
          ].map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input className="input" type="number" value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
            </div>
          ))}
          <div className="field">
            <label>ใช้รหัสลับประจำคาบเป็นค่าเริ่มต้น</label>
            <select className="select" value={String(Boolean(form.secretCodeEnabled))} onChange={(e) => setForm({ ...form, secretCodeEnabled: e.target.value === "true" })}>
              <option value="false">ปิด</option>
              <option value="true">เปิด</option>
            </select>
          </div>
          <button className="btn">บันทึกการตั้งค่า</button>
        </form>
        {saved ? <div className="notice" style={{ marginTop: 14 }}>บันทึกการตั้งค่าแล้ว</div> : null}
      </section>
    </AppShell>
  );
}
