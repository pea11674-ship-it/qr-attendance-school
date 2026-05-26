import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const classrooms = await prisma.classroom.findMany({
    include: { _count: { select: { students: true, subjects: true } } },
    orderBy: [{ level: "asc" }, { room: "asc" }]
  });
  return NextResponse.json({ classrooms });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN"]);
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const classroom = await prisma.classroom.create({
    data: { level: body.level, room: body.room, name: body.name || `${body.level}/${body.room}` }
  });
  return NextResponse.json({ classroom }, { status: 201 });
}
