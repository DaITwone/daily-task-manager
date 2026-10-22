
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  employeeId: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(72),
});

const SESSION_DURATION = 7 * 24 * 60 * 60;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error("SESSION_SECRET phải là chuỗi hex 64 ký tự.");
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Vui lòng nhập mã nhân viên và mật khẩu hợp lệ." },
        { status: 400 },
      );
    }

    const { employeeId, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        jobTitle: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Mã nhân viên hoặc mật khẩu không chính xác." },
        { status: 401 },
      );
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Mã nhân viên hoặc mật khẩu không chính xác." },
        { status: 401 },
      );
    }

    const secret = getSessionSecret();

    const token = await new SignJWT({
      employeeId: user.employeeId,
      jobTitle: user.jobTitle,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("7d")
      .setIssuer("daily-task-manager")
      .setAudience("daily-task-manager-web")
      .sign(secret);

    const response = NextResponse.json({
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        email: user.email,
        jobTitle: user.jobTitle,
      },
    });

    response.cookies.set("dtm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Không thể đăng nhập lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
