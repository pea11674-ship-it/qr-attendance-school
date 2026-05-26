import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export function toUserRole(role: string): UserRole {
  if (role === "ADMIN" || role === "TEACHER" || role === "STUDENT") return role;
  return "STUDENT";
}

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  teacherId?: string;
  studentId?: string;
};

const cookieName = "qr_attendance_token";

function secret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(user: AuthUser) {
  return jwt.sign(user, secret(), { expiresIn: "8h" });
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(cookieName, "", { maxAge: 0, path: "/" });
}

export async function getCurrentUserFromToken(token?: string): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { teacher: true, student: true }
    });
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: toUserRole(user.role),
      teacherId: user.teacher?.id,
      studentId: user.student?.id
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  return getCurrentUserFromToken(cookies().get(cookieName)?.value);
}

export async function requireApiUser(req: NextRequest, roles?: UserRole[]) {
  const user = await getCurrentUserFromToken(req.cookies.get(cookieName)?.value);
  if (!user) {
    return { error: NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  }
  if (roles?.length && !roles.includes(user.role)) {
    return { error: NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" }, { status: 403 }) };
  }
  return { user };
}
