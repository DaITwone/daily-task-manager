import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

type AuthShellProps = {
  children: ReactNode;
  mode: "login" | "register";
};

/**
 * Bảng màu 7-Eleven: cam #F47B20 · xanh lá #008061 · đỏ #EE2A24
 */

const keyframes = `
@keyframes dtm-pop {
  from { opacity: 0; transform: translateY(24px) rotate(var(--r, 0deg)) scale(.96); }
  to   { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)) scale(1); }
}
@keyframes dtm-tick {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}
.dtm-card { opacity: 0; animation: dtm-pop .6s cubic-bezier(.2,.9,.3,1.2) forwards; }
.dtm-tick { stroke-dasharray: 24; stroke-dashoffset: 24; animation: dtm-tick .4s ease-out 1.3s forwards; }
@media (prefers-reduced-motion: reduce) {
  .dtm-card { opacity: 1; animation: none; transform: rotate(var(--r, 0deg)); }
  .dtm-tick { stroke-dashoffset: 0; animation: none; }
}
`;

function Mark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <span
      className={`inline-flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ${
        isLg ? "h-16 w-16" : "h-11 w-11"
      }`}
      aria-hidden="true"
    >
      <span
        className={`flex flex-1 items-center justify-center font-black leading-none text-[#008061] ${
          isLg ? "text-4xl" : "text-2xl"
        }`}
      >
        7
      </span>
      <span className="flex h-1.5 w-full">
        <span className="flex-1 bg-[#F47B20]" />
        <span className="flex-1 bg-[#008061]" />
        <span className="flex-1 bg-[#EE2A24]" />
      </span>
    </span>
  );
}

function Avatar({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white first:ml-0 ${color}`}
    >
      {label}
    </span>
  );
}

export function AuthShell({ children, mode }: AuthShellProps) {
  const isLogin = mode === "login";

  return (
    <main className="relative flex min-h-screen justify-center bg-[#FFF8EC] px-4 py-8 md:py-10">
      <style>{keyframes}</style>

      {/* Nền vui mắt: cố định theo màn hình, không bị form dài kéo giãn hay che */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#F47B20]/20" />
        <span className="absolute -right-10 bottom-10 h-64 w-64 rotate-12 rounded-[3rem] bg-[#008061]/15" />
        <span className="absolute right-1/4 top-6 h-10 w-10 rounded-full bg-[#EE2A24]/70" />
      </div>

      <div className="relative my-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-25px_rgba(0,90,60,0.45)] md:grid-cols-[1.08fr_1fr]">
        {" "}
        {/* Panel trái */}
        <section className="relative hidden overflow-hidden bg-[#008061] text-white md:block">
          <div className="relative flex h-full flex-col p-8 lg:p-10">
            {" "}
            {/* Dải sọc 3 màu chéo, nét đặc trưng của biển hiệu */}
            <div
              className="pointer-events-none absolute -bottom-16 -left-24 w-[150%] -rotate-[14deg]"
              aria-hidden="true"
            >
              <span className="block h-7 bg-[#F47B20]" />
              <span className="block h-7 bg-white" />
              <span className="block h-7 bg-[#EE2A24]" />
            </div>
            <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#F47B20]" />
            <div className="relative z-10 inline-flex w-fit items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden">
                {/* Thêm ảnh logo tại đây */}
                <Image
                  src="/images/logo.png"
                  alt="Daily Task Manager"
                  width={80}
                  height={80}
                />
              </div>

              <span className="text-xl font-extrabold leading-tight tracking-tight">
                Daily Task
              </span>
            </div>
            <h1 className="relative z-10 mt-7 max-w-sm text-4xl font-bold italic leading-[1.05] tracking-tight text-white lg:text-[2.65rem]">
              <span className="relative z-10 block">Kết nối đội ngũ,</span>
              <span className="relative z-0 -mt-1 ml-3 inline-block -rotate-2 text-[#FFD18C]">
                bứt phá mục tiêu.
              </span>
            </h1>
            {/* Các thẻ công việc minh hoạ */}
            <div className="relative z-10 mt-10 w-full max-w-[22rem]">
              <div
                className="dtm-card flex items-center gap-3 rounded-2xl bg-white p-3.5 text-slate-800 shadow-lg"
                style={{ ["--r" as string]: "-2deg", animationDelay: "0.2s" }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#008061]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path className="dtm-tick" d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Công việc trong ngày
                  </p>
                  <p className="text-xs text-slate-500">Tiến độ hoàn thành</p>
                </div>

                <span className="rounded-full bg-[#008061]/10 px-2.5 py-1 text-xs font-bold text-[#008061]">
                  10/10
                </span>
              </div>

              {/* Card 2: Lịch đội ngũ quản lý */}
              <div
                className="dtm-card ml-6 mt-3 flex items-center gap-3 rounded-2xl bg-white p-3.5 text-slate-800 shadow-lg"
                style={{ ["--r" as string]: "1.5deg", animationDelay: "0.45s" }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47B20]/10 text-[#F47B20]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                    <path d="m9 15 2 2 4-4" />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Lịch đội ngũ quản lý
                  </p>
                  <div className="mt-1 flex items-center">
                    <Avatar label="SM" color="bg-[#008061]" />
                    <Avatar label="AM" color="bg-[#F47B20]" />
                    <Avatar label="OM" color="bg-[#EE2A24]" />
                    <span className="ml-2 text-xs text-slate-500">
                      SM · AM · OM
                    </span>
                  </div>
                </div>

                <span className="rounded-full bg-[#F47B20]/10 px-2.5 py-1 text-xs font-bold text-[#F47B20]">
                  Hôm nay
                </span>
              </div>

              {/* Card 3: Theo dõi vận hành */}
              <div
                className="dtm-card mt-3 flex items-center gap-3 rounded-2xl bg-white p-3.5 text-slate-800 shadow-lg"
                style={{ ["--r" as string]: "-1deg", animationDelay: "0.7s" }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EE2A24]/10 text-[#EE2A24]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19V5M4 19h17" />
                    <path d="m7 15 4-4 3 2 5-6" />
                    <path d="M15 7h4v4" />
                  </svg>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Theo dõi vận hành
                  </p>
                  <p className="text-xs text-slate-500">
                    Tổng hợp công việc các cửa hàng
                  </p>
                </div>

                <span className="rounded-full bg-[#EE2A24]/10 px-2.5 py-1 text-xs font-bold text-[#EE2A24]">
                  Báo cáo
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* Panel form */}
        <section className="flex items-center justify-center px-6 py-8 sm:px-10 md:px-12 md:py-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-3 md:hidden"
            >
              <span className="inline-flex rounded-2xl bg-[#008061] p-1">
                <Mark size="sm" />
              </span>
              <span className="font-extrabold text-slate-900">
                Daily Task Manager
              </span>
            </Link>

            <div className={isLogin ? "mb-8" : "mb-5"}>
              <span
                className="mb-4 flex h-2 w-20 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <span className="flex-1 bg-[#F47B20]" />
                <span className="flex-1 bg-[#008061]" />
                <span className="flex-1 bg-[#EE2A24]" />
              </span>
              <h2
                className={`font-extrabold tracking-tight text-slate-900 ${
                  isLogin ? "text-4xl" : "text-3xl"
                }`}
              >
                {isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isLogin
                  ? "Đăng nhập để xem lịch việc của bạn và cả đội."
                  : "Điền đầy đủ thông tin để bắt đầu sử dụng hệ thống."}
              </p>
            </div>

            {children}

            <p
              className={`text-center text-xs text-slate-400 ${isLogin ? "mt-8" : "mt-5"}`}
            >
              © {new Date().getFullYear()} Daily Task Manager
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
