import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const [teachers, classrooms, academicYears, semesters, settings] = await Promise.all([
    prisma.teacher.findMany({ include: { user: true } }),
    prisma.classroom.findMany({ orderBy: [{ level: "asc" }, { room: "asc" }] }),
    prisma.academicYear.findMany({ orderBy: { year: "desc" } }),
    prisma.semester.findMany({ include: { academicYear: true } }),
    prisma.attendanceSettings.findFirst()
  ]);
  return NextResponse.json({ teachers, classrooms, academicYears, semesters, settings });
}
