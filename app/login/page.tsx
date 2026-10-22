"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ??
            data?.error ??
            "Mã nhân viên hoặc mật khẩu không chính xác.",
        );
        return;
      }

      // Kiểm tra session cookie vừa được tạo.
      const sessionResponse = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        setError("Đăng nhập chưa hoàn tất. Cậu thử lại nhé.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Cậu kiểm tra lại server nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="login">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="employeeId"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Mã nhân viên
          </label>

          <input
            id="employeeId"
            name="employeeId"
            autoComplete="username"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder="1012642"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00843d] focus:bg-white focus:ring-4 focus:ring-[#00843d]/10"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="password"
                className="text-sm font-semibold  text-slate-700"
            >
              Mật khẩu
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00843d] focus:bg-white focus:ring-4 focus:ring-[#00843d]/10"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-slate-400 transition-colors hover:text-[#00843d]"
            >
              {showPassword ? (
                <LockKeyholeOpen size={19} strokeWidth={1.8} />
              ) : (
                <LockKeyhole size={19} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {justRegistered && !error && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Đăng ký thành công!
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00843d] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00843d]/15 transition hover:bg-[#006b32] focus:outline-none focus:ring-4 focus:ring-[#00843d]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          {!loading && <span aria-hidden="true"></span>}
        </button>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-bold text-[#00843d] hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-slate-50" aria-busy="true" />}
    >
      <LoginForm />
    </Suspense>
  );
}
