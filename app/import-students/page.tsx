import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

export default function ImportStudentsPage({
  searchParams
}: {
  searchParams?: { imported?: string; error?: string };
}) {
  return (
    <AppShell>
      <PageHeader
        title="Import Students"
        subtitle="นำเข้ารายชื่อนักเรียนจาก Excel, CSV หรือ PDF รายชื่อห้อง"
      />

      <section className="panel">
        <form action="/api/students/import" method="post" encType="multipart/form-data">
          <input type="hidden" name="commit" value="true" />
          <div className="form-grid">
            <div className="field">
              <label htmlFor="file">ไฟล์รายชื่อนักเรียน</label>
              <input id="file" name="file" className="input" type="file" accept=".xlsx,.xls,.csv,.pdf" required />
            </div>
            <div className="actions" style={{ alignItems: "end" }}>
              <button className="btn" type="submit">นำเข้ารายชื่อ</button>
            </div>
          </div>
        </form>

        {searchParams?.imported ? (
          <div className="notice" style={{ marginTop: 14 }}>
            นำเข้าสำเร็จ {searchParams.imported} รายการ ไปที่เมนูนักเรียนเพื่อตรวจรายชื่อ
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className="notice" style={{ marginTop: 14 }}>
            {searchParams.error === "auth"
              ? "กรุณาเข้าสู่ระบบก่อนนำเข้ารายชื่อ"
              : searchParams.error === "file"
                ? "กรุณาเลือกไฟล์ Excel, CSV หรือ PDF"
                : searchParams.error === "invalid"
                  ? "ไฟล์มีข้อมูลซ้ำหรือข้อมูลไม่ครบ กรุณาตรวจไฟล์อีกครั้ง"
                  : "นำเข้าไม่สำเร็จ กรุณาลองใหม่"}
          </div>
        ) : null}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>รูปแบบไฟล์ที่รองรับ</h2>
        <div className="grid cards">
          <div className="card">
            <strong>Excel / CSV</strong>
            <p className="subtitle">
              ใช้หัวคอลัมน์: รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล, ระดับชั้น, ห้องเรียน, เลขที่, อีเมล, เบอร์โทรศัพท์
            </p>
          </div>
          <div className="card">
            <strong>PDF รายชื่อห้อง</strong>
            <p className="subtitle">
              รองรับไฟล์ที่มีหัวเอกสารระบุชั้น/ห้อง และตาราง เลขที่, เลขประจำตัว, ชื่อ - นามสกุล
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
