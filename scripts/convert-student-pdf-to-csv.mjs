import { readFileSync, writeFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const input = process.argv[2];
const output = process.argv[3] || "students-from-pdf.csv";

if (!input) {
  console.error("Usage: node scripts/convert-student-pdf-to-csv.mjs <input.pdf> [output.csv]");
  process.exit(1);
}

const parser = new PDFParse({ data: readFileSync(input) });
const result = await parser.getText();
await parser.destroy();

const lines = result.text
  .split(/\r?\n/)
  .map((line) => line.replace(/\t+/g, " ").replace(/\s+/g, " ").trim())
  .filter(Boolean);

const headerLine = lines.find((line) => line.includes("มัธยม") && /\d/.test(line)) || "";
const headerNumbers = headerLine.match(/\d+/g) || [];
const level = headerNumbers[0] ? `ม.${headerNumbers[0]}` : "";
const room = headerNumbers[1] || "";
const prefixes = new Set(["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว", "ด.ช.", "ด.ญ."]);

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const rows = [["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ระดับชั้น", "ห้องเรียน", "เลขที่", "อีเมล", "เบอร์โทรศัพท์"]];

for (const line of lines) {
  const match = line.match(/^(\d{1,3})\s+(\d{4,})\s+(.+)$/);
  if (!match) continue;
  const [, number, studentCode, rawName] = match;
  const parts = rawName.split(" ").filter(Boolean);
  const prefix = prefixes.has(parts[0]) ? parts.shift() : "";
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  rows.push([studentCode, prefix, firstName, lastName, level, room, number, "", ""]);
}

writeFileSync(output, "\uFEFF" + rows.map((row) => row.map(csv).join(",")).join("\n"), "utf8");
console.log(`Wrote ${rows.length - 1} students to ${output}`);
