import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/import-students-csv.mjs <students.csv>");
  process.exit(1);
}

const prisma = new PrismaClient();
const text = readFileSync(input, "utf8").replace(/^\uFEFF/, "");
const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

let imported = 0;
let skipped = 0;

for (const row of parsed.data) {
  const studentCode = String(row["รหัสนักเรียน"] || "").trim();
  const firstName = String(row["ชื่อ"] || "").trim();
  const lastName = String(row["นามสกุล"] || "").trim();
  const level = String(row["ระดับชั้น"] || "").trim();
  const room = String(row["ห้องเรียน"] || "").trim();
  if (!studentCode || !firstName || !lastName || !level || !room) {
    skipped++;
    continue;
  }

  const exists = await prisma.student.findUnique({ where: { studentCode } });
  if (exists) {
    skipped++;
    continue;
  }

  const classroom = await prisma.classroom.upsert({
    where: { level_room: { level, room } },
    update: {},
    create: { level, room, name: `${level}/${room}` }
  });

  const user = await prisma.user.upsert({
    where: { username: studentCode },
    update: {},
    create: {
      username: studentCode,
      email: `${studentCode}@school.local`,
      name: `${firstName} ${lastName}`,
      role: "STUDENT",
      passwordHash: await bcrypt.hash("password123", 10)
    }
  });

  await prisma.student.create({
    data: {
      userId: user.id,
      studentCode,
      prefix: String(row["คำนำหน้า"] || "").trim() || null,
      firstName,
      lastName,
      level,
      number: row["เลขที่"] ? Number(row["เลขที่"]) : null,
      classroomId: classroom.id
    }
  });
  imported++;
}

await prisma.$disconnect();
console.log(`Imported ${imported}, skipped ${skipped}`);
