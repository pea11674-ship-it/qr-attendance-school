import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserFromToken, requireApiUser } from "@/lib/auth";
import { parseStudentFile } from "@/lib/import-students";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const wantsRedirect = form.get("commit") === "true";
  const user = await getCurrentUserFromToken(req.cookies.get("qr_attendance_token")?.value);
  if (!user || !["ADMIN", "TEACHER"].includes(user.role)) {
    // MVP local fallback: allow browser form imports while running locally.
    // JSON/API callers still receive the normal auth error.
    if (!wantsRedirect || process.env.NODE_ENV === "production") {
      if (wantsRedirect) return NextResponse.redirect(new URL("/login?error=auth", req.url), { status: 303 });
      const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
      if ("error" in auth) return auth.error;
    }
  }

  const file = form.get("file");
  const commit = form.get("commit") === "true";
  if (!(file instanceof File)) {
    if (wantsRedirect) return NextResponse.redirect(new URL("/import-students?error=file", req.url), { status: 303 });
    return NextResponse.json({ message: "กรุณาเลือกไฟล์ Excel, CSV หรือ PDF" }, { status: 400 });
  }

  const rows = await parseStudentFile(file);
  const codes = rows.map((row) => row.studentCode).filter(Boolean);
  const existing = await prisma.student.findMany({
    where: { studentCode: { in: codes } },
    select: { studentCode: true }
  });
  const duplicateCodes = new Set(existing.map((item) => item.studentCode));
  const preview = rows.map((row) => ({
    ...row,
    duplicateInDatabase: duplicateCodes.has(row.studentCode),
    errors: duplicateCodes.has(row.studentCode) ? [...row.errors, "รหัสนักเรียนซ้ำในระบบ"] : row.errors
  }));

  const hasBlockingErrors = preview.some((row) => row.errors.some((error: string) => error !== "รหัสนักเรียนซ้ำในระบบ"));
  const hasErrors = preview.some((row) => row.errors.length > 0);
  if (hasBlockingErrors && wantsRedirect) {
    return NextResponse.redirect(new URL("/import-students?error=invalid", req.url), { status: 303 });
  }
  if (!commit || (hasErrors && !wantsRedirect)) return NextResponse.json({ preview, hasErrors });

  const imported = await prisma.$transaction(async (tx) => {
    const output = [];
    for (const row of preview.filter((item) => !item.duplicateInDatabase)) {
      const classroom = await tx.classroom.upsert({
        where: { level_room: { level: row.level, room: row.classroomRoom } },
        update: {},
        create: { level: row.level, room: row.classroomRoom, name: `${row.level}/${row.classroomRoom}` }
      });
      const loginUser = await tx.user.upsert({
        where: { username: row.studentCode },
        update: {},
        create: {
          username: row.studentCode,
          email: row.email || `${row.studentCode}@school.local`,
          name: `${row.firstName} ${row.lastName}`,
          role: "STUDENT",
          passwordHash: await bcrypt.hash("password123", 10)
        }
      });
      output.push(
        await tx.student.create({
          data: {
            userId: loginUser.id,
            studentCode: row.studentCode,
            prefix: row.prefix,
            firstName: row.firstName,
            lastName: row.lastName,
            level: row.level,
            number: row.number,
            email: row.email,
            phone: row.phone,
            classroomId: classroom.id
          }
        })
      );
    }
    return output;
  });

  if (wantsRedirect) {
    return NextResponse.redirect(new URL(`/import-students?imported=${imported.length}`, req.url), { status: 303 });
  }
  return NextResponse.json({ imported: imported.length, preview, hasErrors: false });
}
