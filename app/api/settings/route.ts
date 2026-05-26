import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const settings = await prisma.attendanceSettings.findFirst();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const current = await prisma.attendanceSettings.findFirst();
  const settings = await prisma.attendanceSettings.upsert({
    where: { id: current?.id || "default-settings" },
    update: {
      qrTtlSeconds: Number(body.qrTtlSeconds),
      presentWindowMinutes: Number(body.presentWindowMinutes),
      lateWindowMinutes: Number(body.lateWindowMinutes),
      warningAbsenceCount: Number(body.warningAbsenceCount),
      criticalAbsenceCount: Number(body.criticalAbsenceCount),
      lateToAbsenceRatio: Number(body.lateToAbsenceRatio),
      minimumAttendancePercent: Number(body.minimumAttendancePercent),
      secretCodeEnabled: Boolean(body.secretCodeEnabled)
    },
    create: body
  });
  return NextResponse.json({ settings });
}
