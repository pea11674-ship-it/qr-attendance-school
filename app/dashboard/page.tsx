import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sessionWhere = user.role === "TEACHER" ? { subject: { teacherId: user.teacherId } } : user.role === "STUDENT" ? { records: { some: { studentId: user.studentId } } } : {};
  const [subjects, sessionsToday, records, students] = await Promise.all([
    prisma.subject.count({ where: user.role === "TEACHER" ? { teacherId: user.teacherId } : undefined }),
    prisma.attendanceSession.count({ where: { ...sessionWhere, sessionDate: { gte: today, lt: tomorrow } } }),
    prisma.attendanceRecord.findMany({ where: { session: { ...sessionWhere, sessionDate: { gte: today, lt: tomorrow } } } }),
    prisma.student.count()
  ]);

  const count = (status: string) => records.filter((record) => record.status === status).length;
  const present = count("PRESENT");
  const total = records.length;
  const risk = await prisma.attendanceRecord.groupBy({
    by: ["studentId"],
    where: { status: "ABSENT", session: user.role === "TEACHER" ? { subject: { teacherId: user.teacherId } } : undefined },
    _count: { studentId: true },
    orderBy: { _count: { studentId: "desc" } },
    take: 6
  });
  const riskStudents = await prisma.student.findMany({ where: { id: { in: risk.map((item) => item.studentId) } }, include: { classroom: true } });

  return (
    <AppShell>
      <PageHeader title="Dashboard" subtitle="สรุปภาพรวมการเข้าเรียนตามบทบาทผู้ใช้งาน" />
      <section className="grid cards">
        <div className="card">คาบเรียนวันนี้<div className="metric">{sessionsToday}</div></div>
        <div className="card">รายวิชาที่รับผิดชอบ<div className="metric">{subjects}</div></div>
        <div className="card">นักเรียนทั้งหมด<div className="metric">{students}</div></div>
        <div className="card">อัตรามาเรียนวันนี้<div className="metric">{total ? Math.round((present / total) * 100) : 0}%</div></div>
        <div className="card">มาเรียน<div className="metric">{present}</div></div>
        <div className="card">มาสาย<div className="metric">{count("LATE")}</div></div>
        <div className="card">ขาดเรียน<div className="metric">{count("ABSENT")}</div></div>
        <div className="card">ลา<div className="metric">{count("LEAVE")}</div></div>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>นักเรียนที่ควรติดตาม</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ห้อง</th><th>จำนวนขาด</th><th>สถานะความเสี่ยง</th></tr></thead>
            <tbody>
              {risk.map((item) => {
                const student = riskStudents.find((row) => row.id === item.studentId);
                return (
                  <tr key={item.studentId}>
                    <td>{student?.studentCode}</td>
                    <td>{student?.firstName} {student?.lastName}</td>
                    <td>{student?.classroom.name}</td>
                    <td>{item._count.studentId}</td>
                    <td><span className={`badge ${item._count.studentId >= 5 ? "bad" : "warn"}`}>{item._count.studentId >= 5 ? "เกินเกณฑ์" : "เฝ้าระวัง"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
