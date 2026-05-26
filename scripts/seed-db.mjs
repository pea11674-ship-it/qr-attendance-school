import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

function sqlitePathFromEnv() {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (!url.startsWith("file:")) return resolve(process.cwd(), "prisma", "dev.db");
  const rawPath = url.slice("file:".length);
  return isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), rawPath);
}

const dbPath = sqlitePathFromEnv();
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

function now() {
  return new Date().toISOString();
}

function get(table, whereColumn, value) {
  return db.prepare(`SELECT * FROM "${table}" WHERE "${whereColumn}" = ? LIMIT 1`).get(value);
}

function insert(table, data) {
  const keys = Object.keys(data);
  const columns = keys.map((key) => `"${key}"`).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  db.prepare(`INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`).run(...keys.map((key) => data[key]));
  return data;
}

function ensure(table, whereColumn, value, data) {
  return get(table, whereColumn, value) || insert(table, { id: randomUUID(), ...data });
}

async function ensureUser(username, name, role) {
  const existing = get("User", "username", username);
  if (existing) return existing;
  return insert("User", {
    id: randomUUID(),
    username,
    email: `${username}@school.local`,
    name,
    role,
    passwordHash: await bcrypt.hash("password123", 10),
    isActive: 1,
    createdAt: now(),
    updatedAt: now()
  });
}

const school = get("School", "id", "default-school");
if (!school) {
  insert("School", {
    id: "default-school",
    name: "โรงเรียนตัวอย่าง",
    pdpaText: "ข้อมูลนี้ถูกใช้เพื่อการบริหารจัดการชั้นเรียน การติดตามการเข้าเรียน และการจัดทำรายงานทางวิชาการของโรงเรียนเท่านั้น",
    createdAt: now(),
    updatedAt: now()
  });
}

if (!get("AttendanceSettings", "id", "default-settings")) {
  insert("AttendanceSettings", {
    id: "default-settings",
    qrTtlSeconds: 60,
    presentWindowMinutes: 15,
    lateWindowMinutes: 15,
    warningAbsenceCount: 3,
    criticalAbsenceCount: 5,
    lateToAbsenceRatio: 3,
    minimumAttendancePercent: 80,
    secretCodeEnabled: 0,
    updatedAt: now()
  });
}

const admin = await ensureUser("admin", "ผู้ดูแลระบบ", "ADMIN");
const teacherUser = await ensureUser("teacher", "ครูสมชาย ใจดี", "TEACHER");
const studentUser = await ensureUser("65001", "เด็กหญิงมะลิ รักเรียน", "STUDENT");

let year = get("AcademicYear", "year", "2569");
if (!year) {
  year = insert("AcademicYear", { id: randomUUID(), year: "2569", isActive: 1, createdAt: now() });
}

let semester = db.prepare('SELECT * FROM "Semester" WHERE "name" = ? AND "academicYearId" = ? LIMIT 1').get("1", year.id);
if (!semester) {
  semester = insert("Semester", { id: randomUUID(), name: "1", academicYearId: year.id });
}

let teacher = get("Teacher", "userId", teacherUser.id);
if (!teacher) {
  teacher = insert("Teacher", { id: randomUUID(), userId: teacherUser.id, employeeCode: "T001", phone: "0812345678" });
}

let classroom = db.prepare('SELECT * FROM "Classroom" WHERE "level" = ? AND "room" = ? LIMIT 1').get("ม.1", "1");
if (!classroom) {
  classroom = insert("Classroom", {
    id: randomUUID(),
    level: "ม.1",
    room: "1",
    name: "ม.1/1",
    homeroomTeacherId: teacher.id,
    createdAt: now(),
    updatedAt: now()
  });
}

let subject = db
  .prepare('SELECT * FROM "Subject" WHERE "code" = ? AND "classroomId" = ? AND "semesterId" = ? AND "academicYearId" = ? LIMIT 1')
  .get("TH101", classroom.id, semester.id, year.id);
if (!subject) {
  subject = insert("Subject", {
    id: randomUUID(),
    code: "TH101",
    name: "ภาษาไทยพื้นฐาน",
    teacherId: teacher.id,
    classroomId: classroom.id,
    dayOfWeek: 1,
    startsAt: "09:00",
    endsAt: "10:00",
    academicYearId: year.id,
    semesterId: semester.id,
    createdAt: now(),
    updatedAt: now()
  });
}

let student = get("Student", "studentCode", "65001");
if (!student) {
  student = insert("Student", {
    id: randomUUID(),
    userId: studentUser.id,
    studentCode: "65001",
    prefix: "ด.ญ.",
    firstName: "มะลิ",
    lastName: "รักเรียน",
    level: "ม.1",
    number: 1,
    email: "65001@school.local",
    classroomId: classroom.id,
    createdAt: now(),
    updatedAt: now()
  });
}

const enrollment = db.prepare('SELECT * FROM "Enrollment" WHERE "studentId" = ? AND "subjectId" = ? LIMIT 1').get(student.id, subject.id);
if (!enrollment) {
  insert("Enrollment", { id: randomUUID(), studentId: student.id, subjectId: subject.id, classroomId: classroom.id, createdAt: now() });
}

db.close();
console.log("Seeded users: admin / teacher / 65001, password: password123");
