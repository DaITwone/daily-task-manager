
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để tiếp tục." },
        { status: 401 },
      );
    }

    // Đọc lại tài khoản từ database để lấy thông tin mới nhất.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        jobTitle: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { message: "Tài khoản không còn tồn tại." },
        { status: 401 },
      );

      response.cookies.set("dtm_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      { message: "Không thể xác minh phiên đăng nhập." },
      { status: 500 },
    );
  }
}
