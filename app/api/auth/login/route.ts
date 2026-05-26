import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie, signAuthToken, toUserRole, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  const isBrowserForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  let username = "";
  let password = "";
  let redirectTo = "/dashboard";

  if (isBrowserForm) {
    const form = await req.formData();
    username = String(form.get("username") || "");
    password = String(form.get("password") || "");
    redirectTo = String(form.get("redirectTo") || "/dashboard");
  } else {
    const body = await req.json();
    username = String(body.username || "");
    password = String(body.password || "");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { teacher: true, student: true }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    if (isBrowserForm) {
      return NextResponse.redirect(new URL("/login?error=1", req.url), { status: 303 });
    }
    return NextResponse.json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const authUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: toUserRole(user.role),
    teacherId: user.teacher?.id,
    studentId: user.student?.id
  };

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  const res = isBrowserForm
    ? NextResponse.redirect(new URL(safeRedirect, req.url), { status: 303 })
    : NextResponse.json({ user: authUser });
  setAuthCookie(res, signAuthToken(authUser));
  return res;
}
