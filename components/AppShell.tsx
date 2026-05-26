"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Building2, FileSpreadsheet, LayoutDashboard, QrCode, Settings, Users } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "นักเรียน", icon: Users },
  { href: "/import-students", label: "นำเข้ารายชื่อ", icon: FileSpreadsheet },
  { href: "/classrooms", label: "ห้องเรียน", icon: Building2 },
  { href: "/subjects", label: "รายวิชา", icon: BookOpen },
  { href: "/attendance", label: "เช็กชื่อ QR", icon: QrCode },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/settings", label: "ตั้งค่า", icon: Settings }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (res) => {
      if (res.ok) setUser((await res.json()).user);
    });
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">School QR Attendance</div>
        <div style={{ marginBottom: 18, color: "#bfe0e5", fontSize: 14 }}>
          {user ? `${user.name} (${user.role})` : "ยังไม่ได้เข้าสู่ระบบ"}
        </div>
        <nav className="nav">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
