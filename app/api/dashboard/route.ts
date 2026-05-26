import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if ("error" in auth) return auth.error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const subjectWhere = auth.user.role === "TEACHER" ? { teacherId: auth.user.teacherId } : {};
  const sessionWhere =
    auth.user.role === "STUDENT"
      ? { records: { some: { studentId: auth.user.studentId } } }
      : auth.user.role === "TEACHER"
        ? { subject: { teacherId: auth.user.teacherId } }
        : {};

  const [subjects, sessionsToday, recordsToday, riskyStudents] = await Promise.all([
    prisma.subject.count({ where: subjectWhere }),
    prisma.attendanceSession.count({ where: { ...sessionWhere, sessionDate: { gte: today, lt: tomorrow } } }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { session: { ...sessionWhere, sessionDate: { gte: today, lt: tomorrow } } },
      _count: true
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { status: "ABSENT", session: sessionWhere },
      _count: true,
      orderBy: { _count: { studentId: "desc" } },
      take: 8
    })
  ]);

  const counts = Object.fromEntries(recordsToday.map((row) => [row.status, row._count]));
  const riskDetails = await prisma.student.findMany({
    where: { id: { in: riskyStudents.map((item) => item.studentId) } },
    include: { classroom: true }
  });

  const total = Object.values(counts).reduce((sum, item) => sum + Number(item), 0);
  const present = Number(counts.PRESENT || 0);

  return NextResponse.json({
    role: auth.user.role,
    cards: {
      sessionsToday,
      subjects,
      present,
      late: Number(counts.LATE || 0),
      absent: Number(counts.ABSENT || 0),
      leave: Number(counts.LEAVE || 0),
      attendancePercent: total ? Math.round((present / total) * 100) : 0
    },
    riskyStudents: riskyStudents.map((item) => {
      const student = riskDetails.find((detail) => detail.id === item.studentId);
      return { ...student, absenceCount: item._count };
    })
  });
}
