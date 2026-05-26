# Deploy แบบไม่ต้องเปิดคอมค้าง

โปรเจกต์นี้เตรียม Docker ไว้แล้ว เหมาะกับการนำขึ้นบริการที่มี Web Service + Persistent Disk เช่น Render, Railway หรือ VPS ของโรงเรียน

## วิธีที่แนะนำสำหรับ MVP

ใช้บริการที่รองรับ Docker และมี persistent disk/volume แล้วตั้งค่า:

```text
DATABASE_URL=file:/data/dev.db
JWT_SECRET=สุ่มรหัสยาวๆ
NEXT_PUBLIC_APP_URL=https://โดเมนของระบบ
```

ระบบจะสร้างฐานข้อมูลเองตอน start ด้วยคำสั่ง:

```bash
npm run start:cloud
```

บัญชีเริ่มต้นหลัง deploy:

```text
admin / password123
teacher / password123
65001 / password123
```

หลังนำไปใช้จริงควรเปลี่ยนรหัสผ่านและตั้งค่า `JWT_SECRET` ใหม่เสมอ

## หมายเหตุ

- แบบนี้ใช้ SQLite บน disk ของเซิร์ฟเวอร์ เหมาะกับ MVP/โรงเรียนขนาดเล็ก
- ถ้าจะใช้จริงหลายห้องพร้อมกันหรือหลายโรงเรียน ควรย้ายฐานข้อมูลไป PostgreSQL
- ไม่ควร deploy บน serverless ที่ไม่มี persistent disk เพราะข้อมูล SQLite จะหายเมื่อเครื่องถูกรีสตาร์ท
