import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/inspect-pdf.mjs <file.pdf>");
  process.exit(1);
}

const parser = new PDFParse({ data: readFileSync(file) });
const data = await parser.getText({ partial: [1] });
await parser.destroy();
console.log(data.text.split(/\r?\n/).slice(0, 160).join("\n"));
