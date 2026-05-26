import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { hashToken, resolveStatus, verifySecret } from "@/lib/attendance";
import { getStatusLabel } from "@/lib/status";

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, ["STUDENT"]);
  if ("error" in auth) return auth.error;
  if (!auth.user.studentId) return NextResponse.json({ message: "บัญชีนี้ไม่ใช่นักเรียน" }, { status: 403 });

  const { sessionId, token, secretCode } = await req.json();
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { subject: true }
  });
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ message: "ไม่พบรอบเช็กชื่อที่เปิดอยู่" }, { status: 404 });
  }

  const now = new Date();
  const tokenHash = hashToken(token || "");
  if (session.qrTokenHash !== tokenHash || session.qrExpiresAt < now) {
    return NextResponse.json({ message: "QR Code หมดอายุแล้ว กรุณาสแกนใหม่" }, { status: 410 });
  }
  if (!(await verifySecret(session.secretEnabled, session.secretCodeHash, secretCode))) {
    return NextResponse.json({ message: "รหัสลับประจำคาบไม่ถูกต้อง" }, { status: 400 });
  }

  const status = resolveStatus(now, session.presentEndsAt, session.lateEndsAt);
  if (!status) {
    return NextResponse.json({ message: "หมดเวลาเช็กชื่อ กรุณาติดต่อครูผู้สอน" }, { status: 422 });
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { sessionId_studentId: { sessionId, studentId: auth.user.studentId } }
  });
  if (existing?.checkedInAt) {
    return NextResponse.json({ message: "คุณเช็กชื่อในคาบนี้แล้ว", status: getStatusLabel(existing.status) }, { status: 409 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const userAgent = req.headers.get("user-agent") || "";
  const record = await prisma.attendanceRecord.upsert({
    where: { sessionId_studentId: { sessionId, studentId: auth.user.studentId } },
    update: { status, checkedInAt: now, ipAddress: ip, userAgent, tokenHash, qrExpiresAt: session.qrExpiresAt },
    create: {
      sessionId,
      studentId: auth.user.studentId,
      status,
      checkedInAt: now,
      ipAddress: ip,
      userAgent,
      tokenHash,
      qrExpiresAt: session.qrExpiresAt
    },
    include: { session: { include: { subject: true } } }
  });

  return NextResponse.json({
    message: "เช็กชื่อสำเร็จ",
    status: getStatusLabel(record.status),
    subject: record.session.subject.name,
    checkedInAt: record.checkedInAt
  });
}
