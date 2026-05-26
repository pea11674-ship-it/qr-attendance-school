# ระบบเช็กชื่อเข้าเรียนด้วย QR Code

เว็บแอป MVP สำหรับโรงเรียน รองรับผู้ดูแลระบบ ครู และนักเรียน พร้อมหน้าจอจัดการข้อมูลพื้นฐาน นำเข้ารายชื่อนักเรียน สร้างรอบเช็กชื่อ QR Code ตรวจ token หมดอายุ บันทึกสถานะ แก้ไขพร้อม Audit Log Dashboard และ Export Excel/PDF

## เทคโนโลยี

- Next.js App Router + React
- Prisma Client + SQLite สำหรับ MVP local
- JWT cookie authentication
- Excel/CSV import ด้วย `xlsx` และ `papaparse`
- QR Code ด้วย `qrcode`
- Excel/PDF export ด้วย `exceljs` และ `pdfkit`

## เริ่มใช้งาน

```bash
npm install
npm run setup
npm run dev
```

เปิดเว็บที่ `http://localhost:3000`

## ใช้งานโดยไม่ต้องเปิดคอมค้าง

โปรเจกต์นี้มี `Dockerfile`, `render.yaml` และ [DEPLOY.md](DEPLOY.md) สำหรับนำขึ้นคลาวด์หรือเซิร์ฟเวอร์โรงเรียนแล้ว เมื่อ deploy แล้วครู/นักเรียนเข้าเว็บผ่าน URL ออนไลน์ได้โดยไม่ต้องเปิดคอมเครื่องนี้

บัญชีทดลอง:

```text
admin / password123
teacher / password123
65001 / password123
```

## หน้าจอหลัก

- `/login` เข้าสู่ระบบ
- `/dashboard` แดชบอร์ดตามบทบาท
- `/students` จัดการนักเรียน
- `/import-students` นำเข้า Excel/CSV/PDF พร้อม preview และตรวจข้อมูลซ้ำ
- `/classrooms` จัดการห้องเรียน
- `/subjects` จัดการรายวิชา
- `/attendance` สร้างรอบเช็กชื่อ QR Code และแก้ไขสถานะพร้อมเหตุผล
- `/scan` หน้าสแกนสำหรับนักเรียน
- `/reports` Export Excel/PDF
- `/settings` ตั้งค่า QR, ช่วงเวลาเช็กชื่อ และเกณฑ์ขาดเรียน

## หมายเหตุฐานข้อมูล

ในเครื่องนี้ `prisma db push` มีปัญหากับ SQLite schema engine จึงมี `scripts/init-db.mjs` สำหรับสร้าง SQLite schema local ให้ตรงกับ `prisma/schema.prisma` และยังใช้ Prisma Client สำหรับ query ตามปกติ
