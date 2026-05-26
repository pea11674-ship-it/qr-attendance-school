import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: 32 }}>
      <h1>ระบบเช็กชื่อ QR Code</h1>
      <p>ระบบพร้อมใช้งาน กรุณาเข้าสู่ระบบ</p>
      <p>
        <Link href="/login">ไปหน้า Login</Link>
      </p>
    </main>
  );
}
