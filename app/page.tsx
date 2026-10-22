"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type View = "day" | "week" | "month";
type TaskColor = "green" | "orange" | "red";
type TaskStatus = "Chưa bắt đầu" | "Đang thực hiện" | "Hoàn thành";
type ApiTaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
type CurrentUser = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle: string;
};
type Task = {
  id: string;
  title: string;
  description?: string | null;
  owner: string;
  employeeId: string;
  role: string;
  date: string;
  status: TaskStatus;
  color: TaskColor;
};

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(
    date,
  );
const longDate = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
const shortWeekday = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date);
const taskTone: Record<TaskColor, string> = {
  green: "border-l-[#188038] bg-[#e6f4ea] text-[#137333]",
  orange: "border-l-[#e37400] bg-[#fef7e0] text-[#b06000]",
  red: "border-l-[#d93025] bg-[#fce8e6] text-[#c5221f]",
};
const taskDot: Record<TaskColor, string> = {
  green: "bg-[#188038]",
  orange: "bg-[#e37400]",
  red: "bg-[#d93025]",
};
const statusColor: Record<TaskStatus, string> = {
  "Chưa bắt đầu": "bg-[#fef7e0] text-[#b06000]",
  "Đang thực hiện": "bg-[#e6f4ea] text-[#137333]",
  "Hoàn thành": "bg-[#e8f0fe] text-[#1967d2]",
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<string, ReactNode> = {
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12M6 6l12 12" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] ?? paths.calendar}</svg>;
}

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(() => isoDate(new Date()));
  const [newStatus, setNewStatus] = useState<TaskStatus>("Chưa bắt đầu");

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (active) setCurrentUser(data.user as CurrentUser);
      } catch {
        router.replace("/login");
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (checkingSession) return;
    let active = true;
    async function loadTasks() {
      setLoadingTasks(true);
      setTaskError("");
      const dateForRequest = view === "month" ? currentDate : selectedDate;
      try {
        const params = new URLSearchParams({
          view,
          date: isoDate(dateForRequest),
        });
        const response = await fetch(`/api/tasks?${params.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json();
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok)
          throw new Error(data.message || "Không thể tải công việc.");
        const mapped: Task[] = (data.tasks ?? []).map(
          (item: {
            id: string;
            title: string;
            description?: string | null;
            taskDate: string;
            status: ApiTaskStatus;
            user: { employeeId: string; fullName: string; jobTitle: string };
          }) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            owner: item.user.fullName,
            employeeId: item.user.employeeId,
            role: item.user.jobTitle,
            date: String(item.taskDate).slice(0, 10),
            status:
              item.status === "COMPLETED"
                ? "Hoàn thành"
                : item.status === "IN_PROGRESS"
                  ? "Đang thực hiện"
                  : "Chưa bắt đầu",
            color:
              item.status === "COMPLETED"
                ? "red"
                : item.status === "IN_PROGRESS"
                  ? "green"
                  : "orange",
          }),
        );
        if (active) setTasks(mapped);
      } catch (error) {
        if (active)
          setTaskError(
            error instanceof Error ? error.message : "Không thể tải công việc.",
          );
      } finally {
        if (active) setLoadingTasks(false);
      }
    }
    void loadTasks();
    return () => {
      active = false;
    };
  }, [
    checkingSession,
    view,
    currentDate.getTime(),
    selectedDate.getTime(),
    router,
  ]);

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const monthDays = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
  const visibleDays = useMemo(() => {
    if (view === "day") return [selectedDate];
    if (view === "week")
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        return date;
      });
    return monthDays;
  }, [view, selectedDate, weekStart.getTime(), currentDate.getTime()]);

  const filteredTasks = tasks.filter((task) => {
    const q = search.trim().toLocaleLowerCase("vi");
    return (
      task.title.toLocaleLowerCase("vi").includes(q) ||
      task.owner.toLocaleLowerCase("vi").includes(q) ||
      task.role.toLocaleLowerCase("vi").includes(q) ||
      task.employeeId.toLocaleLowerCase("vi").includes(q) ||
      (task.description ?? "").toLocaleLowerCase("vi").includes(q)
    );
  });
  const tasksForDate = (date: Date) =>
    filteredTasks.filter((task) => task.date === isoDate(date));
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "Đang thực hiện",
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Hoàn thành",
  ).length;

  function moveDate(direction: number) {
    const next = new Date(view === "month" ? currentDate : selectedDate);
    if (view === "day") next.setDate(next.getDate() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setSelectedDate(new Date(next));
    setCurrentDate(new Date(next));
  }
  function goToday() {
    const today = new Date();
    setSelectedDate(today);
    setCurrentDate(today);
  }
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Không thể đăng xuất. Cậu thử lại nhé.");
      setLoggingOut(false);
    }
  }
  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !newDate || savingTask) return;
    setSavingTask(true);
    setTaskError("");
    const status: ApiTaskStatus =
      newStatus === "Hoàn thành"
        ? "COMPLETED"
        : newStatus === "Đang thực hiện"
          ? "IN_PROGRESS"
          : "TODO";
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          taskDate: newDate,
          status,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok)
        throw new Error(data.message || "Không thể tạo công việc.");
      const date = new Date(`${newDate}T12:00:00`);
      setSelectedDate(date);
      setCurrentDate(date);
      setView("month");
      setNewTitle("");
      setNewDescription("");
      setNewDate(isoDate(new Date()));
      setNewStatus("Chưa bắt đầu");
      setShowCreate(false);
      // Fetch the selected month again after the new task has been committed.
      const params = new URLSearchParams({ view: "month", date: newDate });
      const refreshResponse = await fetch(`/api/tasks?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setTasks(
          (refreshData.tasks ?? []).map(
            (item: {
              id: string;
              title: string;
              description?: string | null;
              taskDate: string;
              status: ApiTaskStatus;
              user: { employeeId: string; fullName: string; jobTitle: string };
            }) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              owner: item.user.fullName,
              employeeId: item.user.employeeId,
              role: item.user.jobTitle,
              date: String(item.taskDate).slice(0, 10),
              status:
                item.status === "COMPLETED"
                  ? "Hoàn thành"
                  : item.status === "IN_PROGRESS"
                    ? "Đang thực hiện"
                    : "Chưa bắt đầu",
              color:
                item.status === "COMPLETED"
                  ? "red"
                  : item.status === "IN_PROGRESS"
                    ? "green"
                    : "orange",
            }),
          ),
        );
      }
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Không thể tạo công việc.",
      );
    } finally {
      setSavingTask(false);
    }
  }

  if (checkingSession)
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#5f6368]">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-white text-[#3c4043]">
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}
      <div className="flex min-h-screen">
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-[#dadce0] bg-[#f8fafd] px-4 py-5 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0`}
        >
          <div className="mb-7 flex items-center gap-3 px-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2 hover:bg-[#e8eaed] md:hidden"
              aria-label="Đóng menu"
            >
              <Icon name="close" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <Icon name="calendar" size={21} />
            </div>
            <div>
              <p className="text-[21px] font-normal tracking-tight text-[#5f6368]">
                Calendar
              </p>
              <p className="text-[11px] text-[#80868b]">Daily Task Manager</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="mb-7 flex h-12 w-fit items-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-5 text-sm font-medium shadow-[0_1px_2px_rgba(60,64,67,.15)] transition hover:bg-[#f8fafd] hover:shadow-md"
          >
            <span className="text-[#1a73e8]">
              <Icon name="plus" size={23} />
            </span>{" "}
            Tạo
          </button>

          <div className="mb-5 px-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-[#3c4043]">
                {monthLabel(currentDate)}
              </p>
              <div className="flex">
                <button
                  aria-label="Tháng trước"
                  onClick={() => moveDate(-1)}
                  className="rounded-full p-1.5 hover:bg-[#e8eaed]"
                >
                  <Icon name="chevronLeft" size={17} />
                </button>
                <button
                  aria-label="Tháng sau"
                  onClick={() => moveDate(1)}
                  className="rounded-full p-1.5 hover:bg-[#e8eaed]"
                >
                  <Icon name="chevronRight" size={17} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] text-[#70757a]">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <span key={d} className="pb-2">
                  {d}
                </span>
              ))}
              {monthDays.map((date) => {
                const today = isoDate(date) === isoDate(new Date());
                const selected = isoDate(date) === isoDate(selectedDate);
                return (
                  <button
                    key={isoDate(date)}
                    onClick={() => {
                      setSelectedDate(new Date(date));
                      setCurrentDate(new Date(date));
                      setView("day");
                      setSidebarOpen(false);
                    }}
                    className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${selected ? "bg-[#d3e3fd] font-bold text-[#174ea6]" : today ? "bg-[#1a73e8] font-medium text-white" : date.getMonth() !== currentDate.getMonth() ? "text-[#bdc1c6]" : "hover:bg-[#e8eaed]"}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-[#dadce0] pt-5">
            <p className="mb-3 px-2 text-xs font-medium text-[#5f6368]">
              Lịch của bạn
            </p>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#e8eaed]">
              <span className="h-3 w-3 rounded-[3px] bg-[#1a73e8]" />
              Công việc cá nhân
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#e8eaed]">
              <span className="h-3 w-3 rounded-[3px] bg-[#188038]" />
              Lịch toàn đội
            </button>
          </div>
          <div className="mt-auto border-t border-[#dadce0] pt-4">
            <div className="flex items-center gap-3 px-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d3e3fd] text-sm font-semibold text-[#174ea6]">
                D
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {currentUser?.fullName ?? "Daily Task Manager"}
                </p>
                <p className="text-xs text-[#70757a]">
                  {currentUser
                    ? `${currentUser.employeeId} · ${currentUser.jobTitle}`
                    : "Team calendar"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Đăng xuất"
                className="rounded-full p-2 text-[#5f6368] hover:bg-[#e8eaed] disabled:opacity-50"
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
            {logoutError && (
              <p role="alert" className="mt-2 px-2 text-xs text-red-600">
                {logoutError}
              </p>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[68px] items-center gap-3 border-b border-[#dadce0] bg-white px-3 sm:px-5">
            <button
              aria-label="Mở menu"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full p-2 hover:bg-[#f1f3f4] md:hidden"
            >
              <Icon name="menu" />
            </button>
            <div className="ml-0 flex items-center gap-2 sm:ml-4">
              <button
                onClick={goToday}
                className="h-9 rounded-md border border-[#dadce0] px-4 text-sm font-medium hover:bg-[#f8fafd]"
              >
                Hôm nay
              </button>
              <div className="flex items-center">
                <button
                  aria-label="Kỳ trước"
                  onClick={() => moveDate(-1)}
                  className="rounded-full p-2 hover:bg-[#f1f3f4]"
                >
                  <Icon name="chevronLeft" />
                </button>
                <button
                  aria-label="Kỳ tiếp theo"
                  onClick={() => moveDate(1)}
                  className="rounded-full p-2 hover:bg-[#f1f3f4]"
                >
                  <Icon name="chevronRight" />
                </button>
              </div>
            </div>
            <h1 className="min-w-0 flex-1 truncate pl-1 text-lg font-normal capitalize text-[#3c4043] sm:pl-3 sm:text-[22px]">
              {view === "day"
                ? longDate(selectedDate)
                : view === "week"
                  ? `${longDate(weekStart).split(",")[0]}, ${pad(weekStart.getDate())} – ${pad(visibleDays[6]?.getDate() ?? weekStart.getDate())} ${monthLabel(currentDate)}`
                  : monthLabel(currentDate)}
            </h1>
            <div className="hidden items-center rounded-lg border border-[#dadce0] p-0.5 sm:flex">
              {(["day", "week", "month"] as View[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`rounded-md px-3 py-2 text-xs font-medium ${view === item ? "bg-[#e8f0fe] text-[#174ea6]" : "text-[#5f6368] hover:bg-[#f1f3f4]"}`}
                >
                  {{ day: "Ngày", week: "Tuần", month: "Tháng" }[item]}
                </button>
              ))}
            </div>
            <button
              title="Tìm kiếm"
              className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]"
            >
              <Icon name="search" />
            </button>
            <button
              title="Cài đặt"
              className="hidden rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] sm:block"
            >
              <Icon name="settings" />
            </button>
            <span
              title={currentUser?.fullName ?? "Tài khoản"}
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d3e3fd] text-sm font-semibold text-[#174ea6]"
            >
              {currentUser?.fullName?.trim().charAt(0).toUpperCase() ?? "D"}
            </span>
          </header>

          <div className="border-b border-[#dadce0] px-3 py-3 sm:hidden">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Icon name="search" size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm công việc hoặc nhân viên"
                  className="absolute inset-0 w-full bg-transparent pl-7 text-sm outline-none placeholder:text-[#80868b]"
                />
              </div>
              <select
                aria-label="Chế độ xem"
                value={view}
                onChange={(e) => setView(e.target.value as View)}
                className="rounded-md border border-[#dadce0] bg-white px-2 py-2 text-xs"
              >
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </select>
            </div>
          </div>

          <div className="px-2 pb-5 pt-2 sm:px-4 sm:pt-4">
            <div className="mb-2 flex items-center gap-2 px-2 sm:hidden">
              <span className="text-sm font-medium capitalize">
                {monthLabel(currentDate)}
              </span>
              <button
                onClick={() => setShowCreate(true)}
                className="ml-auto flex items-center gap-1 rounded-full bg-[#1a73e8] px-3 py-2 text-xs font-medium text-white"
              >
                <Icon name="plus" size={16} /> Tạo
              </button>
            </div>
            <div className="mb-3 hidden max-w-sm items-center gap-3 rounded-lg border border-[#dadce0] px-3 sm:flex">
              <Icon name="search" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm công việc hoặc nhân viên..."
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#80868b]"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Xóa tìm kiếm">
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            {taskError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-[#f4c7c3] bg-[#fce8e6] px-4 py-3 text-sm text-[#b3261e]"
              >
                {taskError}
              </div>
            )}
            {loadingTasks && (
              <div className="mb-3 flex items-center gap-2 px-2 py-2 text-sm text-[#5f6368]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                Đang tải công việc từ database...
              </div>
            )}
            {view === "month" && (
              <div className="overflow-hidden rounded-lg border border-[#dadce0]">
                <div className="grid grid-cols-7 border-b border-[#dadce0]">
                  {[
                    "Thứ 2",
                    "Thứ 3",
                    "Thứ 4",
                    "Thứ 5",
                    "Thứ 6",
                    "Thứ 7",
                    "CN",
                  ].map((day) => (
                    <div
                      key={day}
                      className="border-r border-[#dadce0] py-3 text-center text-[10px] font-medium text-[#70757a] last:border-r-0 sm:text-xs"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {visibleDays.map((date) => {
                    const dayTasks = tasksForDate(date);
                    const outside = date.getMonth() !== currentDate.getMonth();
                    const today = isoDate(date) === isoDate(new Date());
                    const selected = isoDate(date) === isoDate(selectedDate);
                    return (
                      <button
                        key={isoDate(date)}
                        onClick={() => {
                          setSelectedDate(new Date(date));
                        }}
                        className={`group flex min-h-[92px] min-w-0 flex-col border-b border-r border-[#dadce0] p-1 text-left transition last:border-r-0 hover:bg-[#f8fafd] sm:min-h-[118px] sm:p-2 lg:min-h-[132px] ${selected ? "bg-[#f8fafd]" : "bg-white"}`}
                      >
                        <span
                          className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${today ? "bg-[#1a73e8] font-semibold text-white" : outside ? "text-[#bdc1c6]" : "text-[#3c4043]"} ${selected && !today ? "bg-[#d3e3fd] font-semibold text-[#174ea6]" : ""}`}
                        >
                          {date.getDate()}
                        </span>
                        <div className="flex w-full flex-col gap-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <span
                              key={task.id}
                              title={`${task.title} · ${task.owner}`}
                              className={`block truncate rounded-sm border-l-2 px-1 py-1 text-left text-[9px] leading-tight sm:px-1.5 sm:text-[11px] ${taskTone[task.color]}`}
                            >
                              {task.title}
                            </span>
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="px-1 text-[10px] font-medium text-[#5f6368]">
                              +{dayTasks.length - 3} nữa
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {view === "week" && (
              <div className="overflow-x-auto rounded-lg border border-[#dadce0]">
                <div className="grid min-w-[700px] grid-cols-7">
                  {visibleDays.map((date) => (
                    <div
                      key={isoDate(date)}
                      className="min-h-[480px] border-r border-[#dadce0] last:border-r-0"
                    >
                      <button
                        onClick={() => {
                          setSelectedDate(new Date(date));
                          setView("day");
                        }}
                        className="flex w-full flex-col items-center border-b border-[#dadce0] py-3 hover:bg-[#f8fafd]"
                      >
                        <span className="text-[11px] uppercase text-[#70757a]">
                          {shortWeekday(date)}
                        </span>
                        <span
                          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-lg ${isoDate(date) === isoDate(new Date()) ? "bg-[#1a73e8] text-white" : "text-[#3c4043]"}`}
                        >
                          {date.getDate()}
                        </span>
                      </button>
                      <div className="space-y-1 p-1.5">
                        {tasksForDate(date).map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedDate(new Date(date))}
                            className={`w-full rounded border-l-2 p-1.5 text-left text-[11px] ${taskTone[task.color]}`}
                          >
                            <span className="block font-medium">
                              {task.title}
                            </span>
                            <span className="mt-1 block truncate opacity-80">
                              {task.owner}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "day" && (
              <div className="overflow-hidden rounded-lg border border-[#dadce0]">
                <div className="flex items-center gap-4 border-b border-[#dadce0] px-5 py-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${isoDate(selectedDate) === isoDate(new Date()) ? "bg-[#1a73e8] text-white" : "bg-[#f1f3f4] text-[#3c4043]"}`}
                  >
                    {selectedDate.getDate()}
                  </span>
                  <div>
                    <h2 className="text-base font-medium capitalize">
                      {longDate(selectedDate)}
                    </h2>
                    <p className="mt-1 text-xs text-[#70757a]">
                      {tasksForDate(selectedDate).length} công việc
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="ml-auto flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1765cc]"
                  >
                    <Icon name="plus" size={18} />
                    Tạo công việc
                  </button>
                </div>
                {tasksForDate(selectedDate).length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                      <Icon name="calendar" size={22} />
                    </div>
                    <p className="text-sm text-[#5f6368]">
                      Ngày này chưa có công việc
                    </p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-4 rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd]"
                    >
                      + Tạo công việc
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#dadce0]">
                    {tasksForDate(selectedDate).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 px-5 py-4"
                      >
                        <span
                          className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${taskDot[task.color]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="mt-1 text-xs text-[#70757a]">
                            {task.owner} · {task.role} · {task.employeeId}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] ${statusColor[task.status]}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-[#5f6368]">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#188038]" />
                Đang thực hiện
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#e37400]" />
                Chưa bắt đầu
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#d93025]" />
                Hoàn thành
              </span>
              <span className="ml-auto text-[11px] text-[#80868b]">
                {totalTasks} công việc · {inProgressTasks} đang làm ·{" "}
                {completedTasks} hoàn thành
              </span>
            </div>
          </div>
        </section>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#202124]/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCreate(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2
                  id="create-task-title"
                  className="text-xl font-normal text-[#202124]"
                >
                  Tạo công việc
                </h2>
                <p className="mt-2 text-sm text-[#5f6368]">
                  Thêm công việc mới vào lịch của đội.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Đóng cửa sổ"
                className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-sm font-medium text-[#3c4043]"
                >
                  Tên công việc <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra tồn kho"
                  className="w-full rounded-lg border border-[#dadce0] px-3.5 py-3 text-sm outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>
              <div>
                <label
                  htmlFor="task-description"
                  className="mb-1.5 block text-sm font-medium text-[#3c4043]"
                >
                  Mô tả (không bắt buộc)
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  maxLength={10000}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Thêm ghi chú cho công việc..."
                  className="w-full resize-y rounded-lg border border-[#dadce0] px-3.5 py-3 text-sm outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>
              <div>
                <label
                  htmlFor="task-date"
                  className="mb-1.5 block text-sm font-medium text-[#3c4043]"
                >
                  Ngày thực hiện
                </label>
                <input
                  id="task-date"
                  required
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[#dadce0] bg-white px-3 py-3 text-sm outline-none focus:border-[#1a73e8]"
                />
              </div>
              <div>
                <label
                  htmlFor="task-status"
                  className="mb-1.5 block text-sm font-medium text-[#3c4043]"
                >
                  Trạng thái
                </label>
                <select
                  id="task-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-lg border border-[#dadce0] bg-white px-3 py-3 text-sm outline-none focus:border-[#1a73e8]"
                >
                  <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                  <option value="Đang thực hiện">Đang thực hiện</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTask ? "Đang lưu..." : "Lưu công việc"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
