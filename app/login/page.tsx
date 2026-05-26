export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <div className="login-page">
      <form className="login-box" action="/api/auth/login" method="post">
        <h1 className="page-title">เข้าสู่ระบบ</h1>
        <p className="subtitle">ครู ผู้ดูแลระบบ และนักเรียนใช้หน้าเดียวกัน</p>
        <input type="hidden" name="redirectTo" value="/dashboard" />
        <div className="grid" style={{ marginTop: 22 }}>
          <div className="field">
            <label htmlFor="username">ชื่อผู้ใช้หรือรหัสนักเรียน</label>
            <input id="username" name="username" className="input" defaultValue="teacher" autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input id="password" name="password" className="input" type="password" defaultValue="password123" autoComplete="current-password" />
          </div>
          {searchParams?.error ? <div className="notice">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</div> : null}
          <button className="btn" type="submit">เข้าสู่ระบบ</button>
          <div className="notice">
            บัญชีทดลอง: admin / teacher / 65001 รหัสผ่าน password123
            <br />
            ข้อมูลนี้ถูกใช้เพื่อการบริหารจัดการชั้นเรียน การติดตามการเข้าเรียน และการจัดทำรายงานทางวิชาการของโรงเรียนเท่านั้น
          </div>
        </div>
      </form>
    </div>
  );
}
