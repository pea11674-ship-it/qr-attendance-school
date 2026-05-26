import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const subjects = await prisma.subject.findMany({
    where: auth.user.role === "TEACHER" ? { teacherId: auth.user.teacherId } : undefined,
    include: { teacher: { include: { user: true } }, classroom: true, semester: true, academicYear: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const subject = await prisma.subject.create({
    data: {
      code: body.code,
      name: body.name,
      teacherId: auth.user.role === "TEACHER" ? auth.user.teacherId! : body.teacherId,
      classroomId: body.classroomId,
      dayOfWeek: Number(body.dayOfWeek),
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      semesterId: body.semesterId,
      academicYearId: body.academicYearId
    }
  });
  return NextResponse.json({ subject }, { status: 201 });
}
