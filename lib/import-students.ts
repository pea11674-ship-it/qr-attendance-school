import * as XLSX from "xlsx";
import Papa from "papaparse";

export type StudentImportRow = {
  studentCode: string;
  prefix?: string;
  firstName: string;
  lastName: string;
  level: string;
  classroomRoom: string;
  number?: number;
  email?: string;
  phone?: string;
  errors: string[];
  duplicateInFile?: boolean;
};

const prefixSet = new Set(["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว", "ด.ช.", "ด.ญ."]);

const aliases: Record<string, keyof Omit<StudentImportRow, "errors" | "duplicateInFile">> = {
  "รหัสนักเรียน": "studentCode",
  studentCode: "studentCode",
  code: "studentCode",
  "คำนำหน้า": "prefix",
  prefix: "prefix",
  "ชื่อ": "firstName",
  firstName: "firstName",
  "นามสกุล": "lastName",
  lastName: "lastName",
  "ระดับชั้น": "level",
  level: "level",
  "ห้องเรียน": "classroomRoom",
  room: "classroomRoom",
  "เลขที่": "number",
  number: "number",
  "อีเมล": "email",
  email: "email",
  username: "email",
  "เบอร์โทรศัพท์": "phone",
  phone: "phone"
};

function normalize(raw: Record<string, unknown>, seen: Set<string>): StudentImportRow {
  const row: Partial<StudentImportRow> = { errors: [] };
  for (const [key, value] of Object.entries(raw)) {
    const mapped = aliases[key.trim()];
    if (!mapped) continue;
    const text = value == null ? "" : String(value).trim();
    if (mapped === "number") row.number = text ? Number(text) : undefined;
    else row[mapped] = text as never;
  }

  for (const field of ["studentCode", "firstName", "lastName", "level", "classroomRoom"] as const) {
    if (!row[field]) row.errors!.push(`ข้อมูลไม่ครบ: ${field}`);
  }
  if (row.studentCode && seen.has(row.studentCode)) {
    row.duplicateInFile = true;
    row.errors!.push("รหัสนักเรียนซ้ำในไฟล์");
  }
  if (row.studentCode) seen.add(row.studentCode);

  return {
    studentCode: row.studentCode || "",
    prefix: row.prefix,
    firstName: row.firstName || "",
    lastName: row.lastName || "",
    level: row.level || "",
    classroomRoom: row.classroomRoom || "",
    number: row.number,
    email: row.email,
    phone: row.phone,
    errors: row.errors || [],
    duplicateInFile: row.duplicateInFile
  };
}

export async function parseStudentFile(file: File) {
  const seen = new Set<string>();
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return parsePdfStudentList(buffer, seen);
  }

  if (ext === "csv") {
    const parsed = Papa.parse<Record<string, unknown>>(buffer.toString("utf8"), {
      header: true,
      skipEmptyLines: true
    });
    return parsed.data.map((row) => normalize(row, seen));
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows.map((row) => normalize(row, seen));
}

async function parsePdfStudentList(buffer: Buffer, seen: Set<string>) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const lines = result.text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const headerLine = lines.find((line) => line.includes("มัธยม") && /\d/.test(line)) || "";
  const headerNumbers = headerLine.match(/\d+/g) || [];
  const level = headerNumbers[0] ? `ม.${headerNumbers[0]}` : "";
  const classroomRoom = headerNumbers[1] || "";

  return lines
    .map((line) => {
      const match = line.match(/^(\d{1,3})\s+(\d{4,})\s+(.+)$/);
      if (!match) return null;

      const [, number, studentCode, rawName] = match;
      const parts = rawName.split(" ").filter(Boolean);
      const prefix = prefixSet.has(parts[0]) ? parts.shift() : undefined;
      const firstName = parts.shift() || "";
      const lastName = parts.join(" ");

      return normalize(
        {
          "รหัสนักเรียน": studentCode,
          "คำนำหน้า": prefix || "",
          "ชื่อ": firstName,
          "นามสกุล": lastName,
          "ระดับชั้น": level,
          "ห้องเรียน": classroomRoom,
          "เลขที่": number
        },
        seen
      );
    })
    .filter((row): row is StudentImportRow => Boolean(row));
}
