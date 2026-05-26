import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

async function user(username: string, name: string, role: UserRole) {
  return prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email: `${username}@school.local`,
      name,
      role,
      passwordHash: await bcrypt.hash("password123", 10)
    }
  });
}

async function main() {
  await prisma.school.upsert({
    where: { id: "default-school" },
    update: {},
    create: { id: "default-school", name: "โรงเรียนตัวอย่าง" }
  });

  await prisma.attendanceSettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: { id: "default-settings" }
  });

  const admin = await user("admin", "ผู้ดูแลระบบ", "ADMIN");
  const teacherUser = await user("teacher", "ครูสมชาย ใจดี", "TEACHER");
  const studentUser = await user("65001", "เด็กหญิงมะลิ รักเรียน", "STUDENT");

  const year = await prisma.academicYear.upsert({
    where: { year: "2569" },
    update: { isActive: true },
    create: { year: "2569", isActive: true }
  });

  const semester = await prisma.semester.upsert({
    where: { name_academicYearId: { name: "1", academicYearId: year.id } },
    update: {},
    create: { name: "1", academicYearId: year.id }
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, employeeCode: "T001", phone: "0812345678" }
  });

  const classroom = await prisma.classroom.upsert({
    where: { level_room: { level: "ม.1", room: "1" } },
    update: {},
    create: { level: "ม.1", room: "1", name: "ม.1/1", homeroomTeacherId: teacher.id }
  });

  const subject = await prisma.subject.upsert({
    where: {
      code_classroomId_semesterId_academicYearId: {
        code: "TH101",
        classroomId: classroom.id,
        semesterId: semester.id,
        academicYearId: year.id
      }
    },
    update: {},
    create: {
      code: "TH101",
      name: "ภาษาไทยพื้นฐาน",
      teacherId: teacher.id,
      classroomId: classroom.id,
      dayOfWeek: 1,
      startsAt: "09:00",
      endsAt: "10:00",
      semesterId: semester.id,
      academicYearId: year.id
    }
  });

  const student = await prisma.student.upsert({
    where: { studentCode: "65001" },
    update: {},
    create: {
      userId: studentUser.id,
      studentCode: "65001",
      prefix: "ด.ญ.",
      firstName: "มะลิ",
      lastName: "รักเรียน",
      level: "ม.1",
      number: 1,
      email: "65001@school.local",
      classroomId: classroom.id
    }
  });

  await prisma.enrollment.upsert({
    where: { studentId_subjectId: { studentId: student.id, subjectId: subject.id } },
    update: {},
    create: { studentId: student.id, subjectId: subject.id, classroomId: classroom.id }
  });

  console.log("Seeded users: admin / teacher / 65001, password: password123");
  void admin;
}

main().finally(async () => prisma.$disconnect());
