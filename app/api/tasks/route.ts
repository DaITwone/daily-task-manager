
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { TaskStatus } from "@/app/generated/prisma/client";

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

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDateRange(view: string, date: Date) {
  const start = new Date(date);
  let end: Date;

  if (view === "day") {
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  } else if (view === "week") {
    const day = start.getUTCDay();
    const daysSinceMonday = (day + 6) % 7;

    start.setUTCDate(start.getUTCDate() - daysSinceMonday);

    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    start.setUTCDate(1);

    end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
  }

  return { start, end };
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).optional(),
  taskDate: z.string().refine((value) => parseDate(value) !== null, {
    message: "Ngày thực hiện không hợp lệ.",
  }),
  status: z.nativeEnum(TaskStatus).optional(),
});

async function getAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
}

// GET /api/tasks?view=month&date=2026-10-22
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để xem lịch." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const view = url.searchParams.get("view") ?? "month";
    const dateString = url.searchParams.get("date");

    if (!["day", "week", "month"].includes(view)) {
      return NextResponse.json(
        { message: "view phải là day, week hoặc month." },
        { status: 400 },
      );
    }

    if (!dateString) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp ngày theo định dạng YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const date = parseDate(dateString);

    if (!date) {
      return NextResponse.json(
        { message: "Ngày không hợp lệ." },
        { status: 400 },
      );
    }

    const { start, end } = getDateRange(view, date);

    const [user, tasks] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true },
      }),
      prisma.task.findMany({
        where: {
          taskDate: {
            gte: start,
            lt: end,
          },
        },
        orderBy: [{ taskDate: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          taskDate: true,
          status: true,
          user: {
            select: { employeeId: true, fullName: true, jobTitle: true },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để xem lịch." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      view,
      range: {
        start: formatDate(start),
        endExclusive: formatDate(end),
      },
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return NextResponse.json(
      { message: "Không thể tải danh sách công việc." },
      { status: 500 },
    );
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { message: "Vui lòng đăng nhập để tạo công việc." },
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

    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Thông tin công việc không hợp lệ.",
          errors: parsed.error.flatten().fieldErrors,
        },
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

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        taskDate: date,
        status: status ?? TaskStatus.TODO,
        userId: user.id,
      },
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

    return NextResponse.json(
      {
        message: "Tạo công việc thành công.",
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create task error:", error);

    return NextResponse.json(
      { message: "Không thể tạo công việc." },
      { status: 500 },
    );
  }
}
