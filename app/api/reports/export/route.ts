import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { getStatusLabel } from "@/lib/status";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, ["ADMIN", "TEACHER"]);
  if ("error" in auth) return auth.error;

  const format = req.nextUrl.searchParams.get("format") || "excel";
  const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;
  const records = await prisma.attendanceRecord.findMany({
    where: {
      sessionId,
      session: auth.user.role === "TEACHER" ? { subject: { teacherId: auth.user.teacherId } } : undefined
    },
    include: { student: { include: { classroom: true } }, session: { include: { subject: { include: { teacher: { include: { user: true } } } } } } },
    orderBy: [{ session: { sessionDate: "desc" } }, { student: { studentCode: "asc" } }]
  });

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.fontSize(18).text("Attendance Summary Report");
    doc.fontSize(10).text("รายงานสรุปผลการเข้าเรียนของนักเรียน");
    doc.moveDown();
    records.forEach((record, index) => {
      doc.text(
        `${index + 1}. ${record.student.studentCode} ${record.student.firstName} ${record.student.lastName} | ${record.session.subject.name} | ${getStatusLabel(record.status)} | ${record.checkedInAt?.toLocaleString("th-TH") || "-"}`
      );
    });
    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));
    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=attendance-report.pdf"
      }
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "วันที่", key: "date", width: 16 },
    { header: "รายวิชา", key: "subject", width: 24 },
    { header: "ห้องเรียน", key: "classroom", width: 14 },
    { header: "ครูผู้สอน", key: "teacher", width: 24 },
    { header: "รหัสนักเรียน", key: "code", width: 16 },
    { header: "ชื่อ-นามสกุล", key: "name", width: 28 },
    { header: "สถานะ", key: "status", width: 14 },
    { header: "เวลาเช็กชื่อ", key: "checkedInAt", width: 22 },
    { header: "หมายเหตุ", key: "note", width: 28 }
  ];
  records.forEach((record) =>
    sheet.addRow({
      date: record.session.sessionDate.toLocaleDateString("th-TH"),
      subject: record.session.subject.name,
      classroom: record.student.classroom.name,
      teacher: record.session.subject.teacher.user.name,
      code: record.student.studentCode,
      name: `${record.student.prefix || ""}${record.student.firstName} ${record.student.lastName}`,
      status: getStatusLabel(record.status),
      checkedInAt: record.checkedInAt?.toLocaleString("th-TH") || "-",
      note: record.note || ""
    })
  );

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=attendance-report.xlsx"
    }
  });
}
