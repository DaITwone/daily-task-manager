import { NextResponse } from "next/server";
import { z } from "zod";
import { TaskStatus } from "@/app/generated/prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date | null {
  if (!datePattern.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).optional(),
  taskDate: z.string().refine((value) => parseDate(value) !== null, {
    message: "Ngày thực hiện không hợp lệ.",
  }),
  status: z.nativeEnum(TaskStatus),
});

type TaskRouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
}

export async function PUT(request: Request, { params }: TaskRouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để sửa công việc." },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Dữ liệu JSON không hợp lệ." },
        { status: 400 },
      );
    }

    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Thông tin công việc không hợp lệ.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const parsedId = z.string().uuid().safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { message: "Mã công việc không hợp lệ." },
        { status: 400 },
      );
    }

    const { title, description, taskDate, status } = parsed.data;
    const date = parseDate(taskDate);

    if (!date) {
      return NextResponse.json(
        { message: "Ngày thực hiện không hợp lệ." },
        { status: 400 },
      );
    }

    const result = await prisma.task.updateMany({
      where: { id, userId: user.id },
      data: {
        title,
        description: description || null,
        taskDate: date,
        status,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy công việc hoặc bạn không có quyền sửa." },
        { status: 404 },
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            employeeId: true,
            fullName: true,
            jobTitle: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Không tìm thấy công việc." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Cập nhật công việc thành công.", task });
  } catch (error) {
    console.error("Update task error:", error);

    return NextResponse.json(
      { message: "Không thể cập nhật công việc." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để xóa công việc." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const parsedId = z.string().uuid().safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { message: "Mã công việc không hợp lệ." },
        { status: 400 },
      );
    }

    const result = await prisma.task.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy công việc hoặc bạn không có quyền xóa." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Đã xóa công việc." });
  } catch (error) {
    console.error("Delete task error:", error);

    return NextResponse.json(
      { message: "Không thể xóa công việc." },
      { status: 500 },
    );
  }
}
