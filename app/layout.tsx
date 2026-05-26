import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบเช็กชื่อ QR Code",
  description: "ระบบเช็กชื่อเข้าเรียนด้วย QR Code และแดชบอร์ดรายงานผล"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
