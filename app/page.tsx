"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";

type View = "day" | "week" | "month";

type TaskColor = "green" | "orange" | "red";

type TaskStatus = "Chưa hoàn thành" | "Hoàn thành";

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
  green: "border-l-[#008061] bg-[#e8f4ef] text-[#006b51]",

  orange: "border-l-[#F47B20] bg-[#fff1df] text-[#a34a00]",

  red: "border-l-[#EE2A24] bg-[#fff0ed] text-[#b4231e]",
};

const taskDot: Record<TaskColor, string> = {
  green: "bg-[#008061]",
  orange: "bg-[#F47B20]",
  red: "bg-[#EE2A24]",
};

const statusColor: Record<TaskStatus, string> = {
  "Chưa hoàn thành": "bg-[#fff1df] text-[#a34a00]",
  "Hoàn thành": "bg-[#e8f4ef] text-[#006b51]",
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
    panelLeftClose: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M9 4v16M14 9l-3 3 3 3" />
      </>
    ),
    panelLeftOpen: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M9 4v16M13 9l3 3-3 3" />
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [newTitle, setNewTitle] = useState("");

  const [newDescription, setNewDescription] = useState("");

  const [newDate, setNewDate] = useState(() => isoDate(new Date()));

  const [newStatus, setNewStatus] = useState<TaskStatus>("Chưa hoàn thành");

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
              item.status === "COMPLETED" ? "Hoàn thành" : "Chưa hoàn thành",

            color: item.status === "COMPLETED" ? "green" : "orange",
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

  // Đóng modal xác nhận đăng xuất bằng phím Esc.
  useEffect(() => {
    if (!showLogoutConfirm) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loggingOut) {
        setShowLogoutConfirm(false);
        setLogoutError("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLogoutConfirm, loggingOut]);

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

  const unfinishedTasks = tasks.filter(
    (task) => task.status === "Chưa hoàn thành",
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Hoàn thành",
  ).length;

  function moveDate(direction: number) {
    if (view === "month") {
      // Chỉ chuyển tháng, không thay đổi ngày đang được chọn.
      // Đặt về ngày 1 để tránh lỗi khi chuyển từ tháng có 31 ngày.
      setCurrentDate((current) => {
        const next = new Date(
          current.getFullYear(),
          current.getMonth() + direction,
          1,
        );

        return next;
      });

      return;
    }

    const next = new Date(selectedDate);

    if (view === "day") {
      next.setDate(next.getDate() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }

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
      newStatus === "Hoàn thành" ? "COMPLETED" : "TODO";

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

      setNewStatus("Chưa hoàn thành");

      setShowCreate(false);

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
                item.status === "COMPLETED" ? "Hoàn thành" : "Chưa hoàn thành",

              color: item.status === "COMPLETED" ? "green" : "orange",
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
      <main className="flex min-h-screen items-center justify-center bg-[#FFF8EC] text-[#52615b]">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#008061] border-t-transparent" />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF8EC] text-[#263b33]">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#F47B20]/10" />
        <span className="absolute -right-20 bottom-8 h-80 w-80 rotate-12 rounded-[4rem] bg-[#008061]/[0.07]" />
        <span className="absolute right-1/4 top-8 h-8 w-8 rounded-full bg-[#EE2A24]/20" />
      </div>

      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#173b2e]/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      <div className="relative z-10 flex min-h-screen">
        <aside
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "md:hidden" : ""} fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col bg-[#FFF8EC]/90 px-4 py-5 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0`}
        >
          <div className="mb-7 flex items-center gap-3 px-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2 hover:bg-[#f4eadb] md:hidden"
              aria-label="Đóng menu"
            >
              <Icon name="close" />
            </button>
            <div
              title="Daily Task"
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#f0e4d2]"
            >
              <Image
                src="/images/logo.png"
                alt="Daily Task logo"
                width={200}
                height={200}
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-extrabold tracking-tight text-[#008061]">
                Daily Task
              </p>
              <p className="text-[11px] text-[#78867f]">Checklist công việc</p>
            </div>
          </div>
          <button
            title="Tạo công việc"
            aria-label="Tạo công việc"
            onClick={() => setShowCreate(true)}
            className="mb-7 flex h-12 w-fit items-center gap-3 rounded-2xl bg-white px-5 text-sm font-semibold text-[#263b33] shadow-[0_8px_20px_rgba(0,96,65,0.12)] ring-1 ring-[#e8dfd0] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,96,65,0.16)]"
          >
            <span className="text-[#F47B20]">
              <Icon name="plus" size={23} />
            </span>
            Tạo công việc
          </button>

          <div className="mb-5 px-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold capitalize text-[#43564d]">
                {monthLabel(currentDate)}
              </p>
              <div className="flex">
                <button
                  aria-label="Tháng trước"
                  onClick={() => moveDate(-1)}
                  className="rounded-full p-1.5 hover:bg-[#f4eadb]"
                >
                  <Icon name="chevronLeft" size={17} />
                </button>
                <button
                  aria-label="Tháng sau"
                  onClick={() => moveDate(1)}
                  className="rounded-full p-1.5 hover:bg-[#f4eadb]"
                >
                  <Icon name="chevronRight" size={17} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] text-[#78867f]">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <span key={d} className="pb-2">
                  {d}
                </span>
              ))}
              {monthDays.map((date) => {
                const today = isoDate(date) === isoDate(new Date());
                const sameDisplayedMonth =
                  date.getMonth() === currentDate.getMonth() &&
                  date.getFullYear() === currentDate.getFullYear();
                const selected =
                  sameDisplayedMonth && isoDate(date) === isoDate(selectedDate);
                const todayInDisplayedMonth =
                  sameDisplayedMonth && isoDate(date) === isoDate(new Date());
                return (
                  <button
                    key={isoDate(date)}
                    onClick={() => {
                      setSelectedDate(new Date(date));
                      setCurrentDate(new Date(date));
                      setView("day");
                      setSidebarOpen(false);
                    }}
                    className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${selected ? "bg-[#008061]/15 font-bold text-[#006b51]" : todayInDisplayedMonth ? "bg-[#008061] font-medium text-white" : !sameDisplayedMonth ? "text-[#c8c3ba]" : "hover:bg-[#f4eadb]"}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-[#f0e4d2] pt-5">
            <p className="mb-3 px-2 text-xs font-semibold text-[#78867f]">
              Lịch của bạn
            </p>
            <button
              title="Công việc cá nhân"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-[#f4eadb]"
            >
              <span className="h-3 w-3 shrink-0 rounded-[3px] bg-[#F47B20]" />
              Công việc cá nhân
            </button>
            <button
              title="Lịch nhóm"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-[#f4eadb]"
            >
              <span className="h-3 w-3 shrink-0 rounded-[3px] bg-[#008061]" />
              Lịch nhóm
            </button>
          </div>
          <div className="mt-auto border-t border-[#f0e4d2] pt-4">
            <div className="flex items-center gap-3 px-2">
              <span
                title={currentUser?.fullName ?? "Tài khoản"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008061] text-sm font-semibold text-white"
              >
                {currentUser?.fullName?.trim().charAt(0).toUpperCase() ?? "D"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {currentUser?.fullName ?? "Daily Task Manager"}
                </p>
                <p className="text-xs text-[#78867f]">
                  {currentUser
                    ? `${currentUser.employeeId} · ${currentUser.jobTitle}`
                    : "Team calendar"}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                disabled={loggingOut}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="rounded-full p-2 text-[#52615b] hover:bg-[#f4eadb] disabled:opacity-50"
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
            {logoutError && !showLogoutConfirm && (
              <p role="alert" className="mt-2 px-2 text-xs text-red-600">
                {logoutError}
              </p>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-3 bg-[#FFF8EC]/90 px-3 backdrop-blur-xl sm:px-5">
            <button
              aria-label="Mở menu"
              onClick={() => setSidebarOpen(true)}
              className="rounded-full p-2 hover:bg-[#f4eadb] md:hidden"
            >
              <Icon name="menu" />
            </button>

            <button
              aria-label={
                sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
              }
              title={
                sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"
              }
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#eadfce] bg-white/70 text-[#52615b] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#008061]/30 hover:bg-white hover:text-[#008061] hover:shadow-md md:inline-flex"
            >
              <Icon
                name={sidebarCollapsed ? "panelLeftOpen" : "panelLeftClose"}
                size={20}
              />
            </button>
            <div className="ml-0 flex items-center gap-2 sm:ml-1">
              <button
                onClick={goToday}
                className="h-9 rounded-xl border border-[#e8dfd0] bg-white/70 px-4 text-sm font-semibold text-[#43564d] transition hover:border-[#008061]/30 hover:bg-white"
              >
                Hôm nay
              </button>

              <div className="flex items-center">
                <button
                  aria-label="Kỳ trước"
                  onClick={() => moveDate(-1)}
                  className="rounded-full p-2 hover:bg-[#f4eadb]"
                >
                  <Icon name="chevronLeft" />
                </button>
                <button
                  aria-label="Kỳ tiếp theo"
                  onClick={() => moveDate(1)}
                  className="rounded-full p-2 hover:bg-[#f4eadb]"
                >
                  <Icon name="chevronRight" />
                </button>
              </div>
            </div>

            <h1 className="min-w-0 flex-1 truncate pl-1 text-lg font-extrabold capitalize tracking-tight text-[#263b33] sm:pl-3 sm:text-[22px]">
              {view === "day"
                ? longDate(selectedDate)
                : view === "week"
                  ? `${longDate(weekStart).split(",")[0]}, ${pad(weekStart.getDate())} – ${pad(visibleDays[6]?.getDate() ?? weekStart.getDate())} ${monthLabel(currentDate)}`
                  : monthLabel(currentDate)}
            </h1>

            <div className="hidden items-center rounded-xl border border-[#e8dfd0] bg-white/70 p-1 shadow-sm sm:flex">
              {(["day", "week", "month"] as View[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${view === item ? "bg-[#008061] text-white shadow-sm" : "text-[#52615b] hover:bg-[#f4eadb]"}`}
                >
                  {{ day: "Ngày", week: "Tuần", month: "Tháng" }[item]}
                </button>
              ))}
            </div>

            <button
              title="Tìm kiếm"
              className="rounded-full p-2 text-[#52615b] hover:bg-[#f4eadb]"
            >
              <Icon name="search" />
            </button>

            <button
              title="Cài đặt"
              className="hidden rounded-full p-2 text-[#52615b] hover:bg-[#f4eadb] sm:block"
            >
              <Icon name="settings" />
            </button>

            <span
              title={currentUser?.fullName ?? "Tài khoản"}
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#008061] text-sm font-semibold text-white"
            >
              {currentUser?.fullName?.trim().charAt(0).toUpperCase() ?? "D"}
            </span>
          </header>

          <div className="border-b border-[#f0e4d2] px-3 py-3 sm:hidden">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Icon name="search" size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm công việc hoặc nhân viên"
                  className="absolute inset-0 w-full bg-transparent pl-7 text-sm outline-none placeholder:text-[#89948e]"
                />
              </div>
              <select
                aria-label="Chế độ xem"
                value={view}
                onChange={(e) => setView(e.target.value as View)}
                className="rounded-xl border border-[#e8dfd0] bg-white px-2 py-2 text-xs"
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
                className="ml-auto flex items-center gap-1 rounded-full bg-[#008061] px-3 py-2 text-xs font-semibold text-white shadow-sm"
              >
                <Icon name="plus" size={16} /> Tạo
              </button>
            </div>

            {taskError && (
              <div
                role="alert"
                className="mb-3 rounded-2xl border border-[#f2c6bd] bg-[#fff0ed] px-4 py-3 text-sm text-[#b4231e]"
              >
                {taskError}
              </div>
            )}

            {view === "month" && (
              <div className="overflow-hidden rounded-[24px] border border-[#eadfce] bg-white shadow-[0_12px_35px_rgba(72,61,43,0.08)]">
                <div className="grid grid-cols-7 border-b border-[#eadfce] bg-[#fffaf2]">
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
                      className="border-r border-[#eadfce] py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#78867f] last:border-r-0 sm:text-xs"
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
                        onDoubleClick={() => {
                          setSelectedDate(new Date(date));
                          setCurrentDate(new Date(date));
                          setNewDate(isoDate(date));
                          setShowCreate(true);
                        }}
                        title="Nhấn đúp để tạo công việc"
                        className={`group flex min-h-[92px] min-w-0 flex-col border-b border-r border-[#f0e8dc] p-1 text-left transition last:border-r-0 hover:bg-[#fffaf2] sm:min-h-[118px] sm:p-2 lg:min-h-[132px] ${selected ? "bg-[#f1f8f4]" : "bg-white"}`}
                      >
                        <span
                          className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${today ? "bg-[#008061] font-semibold text-white" : outside ? "text-[#c8c3ba]" : "text-[#43564d]"} ${selected && !today ? "bg-[#008061]/15 font-semibold text-[#006b51]" : ""}`}
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
                            <span className="px-1 text-[10px] font-semibold text-[#78867f]">
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
              <div className="overflow-x-auto rounded-[24px] border border-[#eadfce] bg-white shadow-[0_12px_35px_rgba(72,61,43,0.08)]">
                <div className="grid min-w-[700px] grid-cols-7">
                  {visibleDays.map((date) => (
                    <div
                      key={isoDate(date)}
                      className="min-h-[480px] border-r border-[#f0e8dc] last:border-r-0"
                    >
                      <button
                        onClick={() => {
                          setSelectedDate(new Date(date));
                          setView("day");
                        }}
                        className="flex w-full flex-col items-center border-b border-[#f0e8dc] py-3 hover:bg-[#fffaf2]"
                      >
                        <span className="text-[11px] font-semibold uppercase text-[#78867f]">
                          {shortWeekday(date)}
                        </span>
                        <span
                          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-lg ${isoDate(date) === isoDate(new Date()) ? "bg-[#008061] font-semibold text-white" : "text-[#43564d]"}`}
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
              <div className="overflow-hidden rounded-[24px] border border-[#eadfce] bg-white shadow-[0_12px_35px_rgba(72,61,43,0.08)]">
                <div className="flex items-center gap-4 border-b border-[#f0e8dc] bg-[#fffaf2] px-5 py-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-semibold ${isoDate(selectedDate) === isoDate(new Date()) ? "bg-[#008061] text-white" : "bg-[#f4eadb] text-[#43564d]"}`}
                  >
                    {selectedDate.getDate()}
                  </span>
                  <div>
                    <h2 className="text-base font-medium capitalize">
                      {longDate(selectedDate)}
                    </h2>
                    <p className="mt-1 text-xs text-[#78867f]">
                      {tasksForDate(selectedDate).length} công việc
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="ml-auto flex items-center gap-2 rounded-full bg-[#008061] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006b51]"
                  >
                    <Icon name="plus" size={18} />
                    Tạo công việc
                  </button>
                </div>

                {tasksForDate(selectedDate).length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4ef] text-[#008061]">
                      <Icon name="calendar" size={22} />
                    </div>
                    <p className="text-sm text-[#52615b]">
                      Ngày này chưa có công việc
                    </p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-4 rounded-full border border-[#008061]/30 px-4 py-2 text-sm font-semibold text-[#008061] transition hover:bg-[#e8f4ef]"
                    >
                      + Tạo công việc
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f0e8dc]">
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
                          <p className="mt-1 text-xs text-[#78867f]">
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

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-[#52615b]">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#F47B20]" />
                Chưa hoàn thành
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#008061]" />
                Hoàn thành
              </span>
              <span className="ml-auto text-[11px] text-[#89948e]">
                {totalTasks} công việc · {unfinishedTasks} chưa hoàn thành ·{" "}
                {completedTasks} hoàn thành
              </span>
            </div>
          </div>
        </section>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#173b2e]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) {
              setShowLogoutConfirm(false);
              setLogoutError("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
            className="w-full max-w-[420px] animate-[logoutIn_160ms_ease-out] overflow-hidden rounded-[28px] border border-[#f0e4d2] bg-white shadow-[0_24px_80px_rgba(32,61,48,0.24)] ring-1 ring-black/5 motion-reduce:animate-none"
          >
            <div className="px-6 pb-5 pt-7 sm:px-8">
              {/* Icon */}
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0ed] text-[#EE2A24]">
                <Icon name="logout" size={26} />
              </div>

              {/* Nội dung */}
              <div className="text-center">
                <h2
                  id="logout-confirm-title"
                  className="text-[22px] font-extrabold tracking-tight text-[#263b33]"
                >
                  Đăng xuất khỏi tài khoản?
                </h2>
              </div>

              {/* Thông tin tài khoản hiện tại */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#f0e4d2] bg-[#fffaf2] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#008061] text-sm font-semibold text-white">
                  {currentUser?.fullName?.trim().charAt(0).toUpperCase() ?? "D"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#263b33]">
                    {currentUser?.fullName ?? "Tài khoản"}
                  </p>
                  <p className="truncate text-xs text-[#78867f]">
                    {currentUser
                      ? `${currentUser.employeeId} · ${currentUser.jobTitle}`
                      : "Daily Task Manager"}
                  </p>
                </div>
              </div>

              {/* Thông báo lỗi */}
              {logoutError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-[#f2c6bd] bg-[#fff0ed] px-3.5 py-2.5 text-sm text-[#b4231e]"
                >
                  <span className="mt-0.5 shrink-0">
                    <Icon name="close" size={16} />
                  </span>
                  <span>{logoutError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end sm:px-8 sm:pb-7">
              <button
                type="button"
                autoFocus
                disabled={loggingOut}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutError("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-[#008061] transition-colors hover:bg-[#e8f4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008061]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="inline-flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-xl bg-[#EE2A24] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#cf211c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EE2A24]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang đăng xuất...
                  </>
                ) : (
                  <>
                    <Icon name="logout" size={18} />
                    Đăng xuất
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#173b2e]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCreate(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="my-auto w-full max-w-lg rounded-[28px] border border-[#f0e4d2] bg-white p-5 shadow-[0_30px_80px_rgba(32,61,48,0.24)] sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2
                  id="create-task-title"
                  className="text-xl font-extrabold text-[#263b33]"
                >
                  Tạo công việc
                </h2>
                <p className="mt-2 text-sm text-[#64736c]">
                  Thêm công việc mới vào lịch của đội.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Đóng cửa sổ"
                className="rounded-full p-2 text-[#52615b] hover:bg-[#f4eadb]"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-sm font-semibold text-[#43564d]"
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
                  className="w-full rounded-xl border border-[#e8dfd0] px-3.5 py-3 text-sm outline-none transition focus:border-[#008061] focus:ring-2 focus:ring-[#008061]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-1.5 block text-sm font-semibold text-[#43564d]"
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
                  className="w-full resize-y rounded-xl border border-[#e8dfd0] px-3.5 py-3 text-sm outline-none transition focus:border-[#008061] focus:ring-2 focus:ring-[#008061]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="task-date"
                  className="mb-1.5 block text-sm font-semibold text-[#43564d]"
                >
                  Ngày thực hiện
                </label>
                <input
                  id="task-date"
                  required
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-[#e8dfd0] bg-white px-3 py-3 text-sm outline-none focus:border-[#008061] focus:ring-2 focus:ring-[#008061]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="task-status"
                  className="mb-1.5 block text-sm font-semibold text-[#43564d]"
                >
                  Trạng thái
                </label>
                <select
                  id="task-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-xl border border-[#e8dfd0] bg-white px-3 py-3 text-sm outline-none focus:border-[#008061] focus:ring-2 focus:ring-[#008061]/15"
                >
                  <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#008061] hover:bg-[#e8f4ef]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-full bg-[#008061] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006b51] disabled:cursor-not-allowed disabled:opacity-60"
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
