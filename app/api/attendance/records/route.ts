import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { closeExpiredSession } from "@/lib/attendance";
import { AttendanceStatus } from "@/lib/status";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ message: "ต้องระบุ sessionId" }, { status: 400 });
  await closeExpiredSession(sessionId);
  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId, session: auth.user.role === "TEACHER" ? { subject: { teacherId: auth.user.teacherId } } : undefined },
    include: { student: { include: { classroom: true } }, editLogs: { orderBy: { editedAt: "desc" } } },
    orderBy: { student: { number: "asc" } }
  });
  return NextResponse.json({ records });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const { recordId, status, reason } = await req.json();
  if (!reason || String(reason).trim().length < 3) {
    return NextResponse.json({ message: "กรุณาระบุเหตุผลในการแก้ไขสถานะ" }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      id: recordId,
      session: auth.user.role === "TEACHER" ? { subject: { teacherId: auth.user.teacherId } } : undefined
    },
    include: { student: true }
  });
  if (!record) return NextResponse.json({ message: "ไม่พบรายการเช็กชื่อ" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.attendanceRecord.update({
      where: { id: record.id },
      data: { status: status as AttendanceStatus, note: reason },
      include: { student: true }
    });
    await tx.attendanceEditLog.create({
      data: {
        recordId: record.id,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        oldStatus: record.status,
        newStatus: status,
        reason,
        editedById: auth.user.id
      }
    });
    return next;
  });

  return NextResponse.json({ record: updated });
}
