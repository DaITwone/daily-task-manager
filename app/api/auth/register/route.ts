
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";


const registerSchema = z.object({
  employeeId: z.string().trim().min(1).max(50),
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  jobTitle: z.enum(["SSL", "ASM", "SM", "AM", "OM"]),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Thông tin đăng ký không hợp lệ.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { employeeId, fullName, email, password, jobTitle } = result.data;

    // Giới hạn theo byte để tránh bcrypt xử lý mật khẩu vượt giới hạn.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { message: "Mật khẩu không được vượt quá 72 byte." },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        employeeId,
        fullName,
        email,
        passwordHash,
        jobTitle,
      },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        jobTitle: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Mã nhân viên hoặc email đã được sử dụng." },
        { status: 409 },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Dữ liệu JSON không hợp lệ." },
        { status: 400 },
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { message: "Không thể đăng ký lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
