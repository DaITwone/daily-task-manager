import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để xem danh sách nhân viên." },
        { status: 401 },
      );
    }

    const [currentUser, users] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true },
      }),
      prisma.user.findMany({
        where: { id: { not: session.userId } },
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          employeeId: true,
          fullName: true,
          jobTitle: true,
        },
      }),
    ]);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Tài khoản không còn tồn tại." },
        { status: 401 },
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get team members error:", error);

    return NextResponse.json(
      { message: "Không thể tải danh sách nhân viên." },
      { status: 500 },
    );
  }
}
