import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { addMinutes, addSeconds, createPlainToken, hashToken } from "@/lib/attendance";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;

  const sessions = await prisma.attendanceSession.findMany({
    where: auth.user.role === "TEACHER" ? { subject: { teacherId: auth.user.teacherId } } : undefined,
    include: {
      subject: { include: { classroom: true } },
      records: { include: { student: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const subject = await prisma.subject.findFirst({
    where: {
      id: body.subjectId,
      ...(auth.user.role === "TEACHER" ? { teacherId: auth.user.teacherId } : {})
    },
    include: { enrollments: true }
  });
  if (!subject) return NextResponse.json({ message: "ไม่พบรายวิชาหรือไม่มีสิทธิ์" }, { status: 404 });

  const settings = await prisma.attendanceSettings.findFirst();
  const now = new Date();
  const token = createPlainToken();
  const secretEnabled = Boolean(body.secretEnabled ?? settings?.secretCodeEnabled);
  const secretCode = body.secretCode || String(Math.floor(1000 + Math.random() * 9000));
  const session = await prisma.attendanceSession.create({
    data: {
      subjectId: subject.id,
      semesterId: subject.semesterId,
      sessionDate: body.sessionDate ? new Date(body.sessionDate) : now,
      periodLabel: body.periodLabel || `${subject.startsAt}-${subject.endsAt}`,
      qrTokenHash: hashToken(token),
      qrExpiresAt: addSeconds(now, Number(body.qrTtlSeconds || settings?.qrTtlSeconds || 60)),
      checkInStartsAt: now,
      presentEndsAt: addMinutes(now, Number(body.presentWindowMinutes || settings?.presentWindowMinutes || 15)),
      lateEndsAt: addMinutes(
        now,
        Number(body.presentWindowMinutes || settings?.presentWindowMinutes || 15) +
          Number(body.lateWindowMinutes || settings?.lateWindowMinutes || 15)
      ),
      secretEnabled,
      secretCodeHash: secretEnabled ? await bcrypt.hash(secretCode, 10) : null,
      createdById: auth.user.id,
      records: {
        create: subject.enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          status: "PENDING_REVIEW"
        }))
      }
    },
    include: { subject: { include: { classroom: true } }, records: { include: { student: true } } }
  });

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/scan?session=${session.id}&token=${token}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 320 });
  return NextResponse.json({ session, scanUrl, qrDataUrl, secretCode: secretEnabled ? secretCode : null });
}
