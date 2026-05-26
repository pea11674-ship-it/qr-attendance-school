import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;

  const classroomId = req.nextUrl.searchParams.get("classroomId") || undefined;
  const search = req.nextUrl.searchParams.get("search") || undefined;
  const students = await prisma.student.findMany({
    where: {
      classroomId,
      OR: search
        ? [
            { studentCode: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } }
          ]
        : undefined
    },
    include: { classroom: true },
    orderBy: [{ classroom: { level: "asc" } }, { number: "asc" }]
  });
  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const body = await req.json();

  const result = await prisma.$transaction(async (tx) => {
    const loginUser = await tx.user.upsert({
      where: { username: body.studentCode },
      update: { name: `${body.firstName} ${body.lastName}` },
      create: {
        username: body.studentCode,
        email: body.email || `${body.studentCode}@school.local`,
        name: `${body.firstName} ${body.lastName}`,
        role: "STUDENT",
        passwordHash: await bcrypt.hash(body.password || "password123", 10)
      }
    });

    return tx.student.create({
      data: {
        userId: loginUser.id,
        studentCode: body.studentCode,
        prefix: body.prefix,
        firstName: body.firstName,
        lastName: body.lastName,
        level: body.level,
        number: body.number ? Number(body.number) : null,
        email: body.email,
        phone: body.phone,
        classroomId: body.classroomId
      },
      include: { classroom: true }
    });
  });

  return NextResponse.json({ student: result }, { status: 201 });
}
