import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromToken(req.cookies.get("qr_attendance_token")?.value);
  if (!user) return NextResponse.json({ message: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  return NextResponse.json({ user });
}
