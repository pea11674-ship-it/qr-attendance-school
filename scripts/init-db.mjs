import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

function sqlitePathFromEnv() {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (!url.startsWith("file:")) return join(process.cwd(), "prisma", "dev.db");
  const rawPath = url.slice("file:".length);
  if (isAbsolute(rawPath)) return rawPath;
  return resolve(process.cwd(), rawPath);
}

const dbPath = sqlitePathFromEnv();
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "School" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "pdpaText" TEXT NOT NULL DEFAULT 'ข้อมูลนี้ถูกใช้เพื่อการบริหารจัดการชั้นเรียน การติดตามการเข้าเรียน และการจัดทำรายงานทางวิชาการของโรงเรียนเท่านั้น',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AcademicYear" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "year" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Semester" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "startsAt" DATETIME,
  "endsAt" DATETIME,
  "academicYearId" TEXT NOT NULL,
  CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Semester_name_academicYearId_key" ON "Semester"("name", "academicYearId");

CREATE TABLE IF NOT EXISTS "Classroom" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "level" TEXT NOT NULL,
  "room" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "homeroomTeacherId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Classroom_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Classroom_level_room_key" ON "Classroom"("level", "room");

CREATE TABLE IF NOT EXISTS "Teacher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "employeeCode" TEXT UNIQUE,
  "phone" TEXT,
  CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "studentCode" TEXT NOT NULL UNIQUE,
  "prefix" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "number" INTEGER,
  "email" TEXT,
  "phone" TEXT,
  "classroomId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Student_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startsAt" TEXT NOT NULL,
  "endsAt" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "semesterId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Subject_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Subject_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Subject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_classroomId_semesterId_academicYearId_key" ON "Subject"("code", "classroomId", "semesterId", "academicYearId");

CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_studentId_subjectId_key" ON "Enrollment"("studentId", "subjectId");

CREATE TABLE IF NOT EXISTS "AttendanceSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subjectId" TEXT NOT NULL,
  "semesterId" TEXT NOT NULL,
  "sessionDate" DATETIME NOT NULL,
  "periodLabel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "qrTokenHash" TEXT NOT NULL,
  "qrExpiresAt" DATETIME NOT NULL,
  "tokenUsedAt" DATETIME,
  "checkInStartsAt" DATETIME NOT NULL,
  "presentEndsAt" DATETIME NOT NULL,
  "lateEndsAt" DATETIME NOT NULL,
  "secretEnabled" BOOLEAN NOT NULL DEFAULT false,
  "secretCodeHash" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AttendanceSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AttendanceSession_subjectId_sessionDate_idx" ON "AttendanceSession"("subjectId", "sessionDate");

CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "checkedInAt" DATETIME,
  "note" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "tokenHash" TEXT,
  "qrExpiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

CREATE TABLE IF NOT EXISTS "AttendanceEditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recordId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "oldStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "editedById" TEXT NOT NULL,
  "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceEditLog_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AttendanceEditLog_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AttendanceSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "qrTtlSeconds" INTEGER NOT NULL DEFAULT 60,
  "presentWindowMinutes" INTEGER NOT NULL DEFAULT 15,
  "lateWindowMinutes" INTEGER NOT NULL DEFAULT 15,
  "warningAbsenceCount" INTEGER NOT NULL DEFAULT 3,
  "criticalAbsenceCount" INTEGER NOT NULL DEFAULT 5,
  "lateToAbsenceRatio" INTEGER NOT NULL DEFAULT 3,
  "minimumAttendancePercent" INTEGER NOT NULL DEFAULT 80,
  "secretCodeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

db.close();
console.log(`SQLite database is ready: ${dbPath}`);
