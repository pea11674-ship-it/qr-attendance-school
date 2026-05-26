import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AttendanceStatus } from "@/lib/status";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPlainToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export async function closeExpiredSession(sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { subject: { include: { enrollments: true } }, records: true }
  });
  if (!session || session.status === "CLOSED" || session.lateEndsAt > new Date()) return session;

  const existing = new Set(session.records.map((record) => record.studentId));
  const missing = session.subject.enrollments.filter((enrollment) => !existing.has(enrollment.studentId));

  await prisma.$transaction([
    ...missing.map((enrollment) =>
      prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: enrollment.studentId,
          status: "ABSENT",
          note: "ระบบบันทึกขาดเรียนอัตโนมัติหลังหมดเวลาเช็กชื่อ"
        }
      })
    ),
    prisma.attendanceSession.update({ where: { id: session.id }, data: { status: "CLOSED" } })
  ]);

  return prisma.attendanceSession.findUnique({ where: { id: sessionId } });
}

export function resolveStatus(now: Date, presentEndsAt: Date, lateEndsAt: Date) {
  if (now <= presentEndsAt) return "PRESENT" as AttendanceStatus;
  if (now <= lateEndsAt) return "LATE" as AttendanceStatus;
  return null;
}

export async function verifySecret(enabled: boolean, hash: string | null, secretCode?: string) {
  if (!enabled) return true;
  if (!hash || !secretCode) return false;
  return bcrypt.compare(secretCode, hash);
}

export const attendanceInclude = {
  student: { include: { classroom: true } },
  session: { include: { subject: true } }
} satisfies Prisma.AttendanceRecordInclude;
