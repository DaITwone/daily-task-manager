"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Mail } from "lucide-react";


const jobTitles = [
  { value: "SSL", label: "SSL" },
  { value: "ASM", label: "ASM" },
  { value: "SM", label: "SM" },
  { value: "AM", label: "AM" },
  { value: "OM", label: "OM" },
];

const steps = [
  { title: "Email", hint: "" },
  { title: "Thông tin", hint: "" },
  { title: "Mật khẩu", hint: "" },
];

const stepColors = ["bg-[#F47B20]", "bg-[#008061]", "bg-[#EE2A24]"];

const stepAnimation = `
@keyframes dtm-step {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
.dtm-step { animation: dtm-step .25s ease-out; }
@media (prefers-reduced-motion: reduce) { .dtm-step { animation: none; } }
`;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("SSL");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLastStep = step === steps.length - 1;

  function goBack() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Bước 1 và 2: chỉ chuyển bước (trình duyệt đã kiểm tra các ô required của bước hiện tại)
    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          jobTitle,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ??
            data?.error ??
            "Đăng ký thất bại. Cậu kiểm tra lại thông tin nhé.",
        );
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Không thể kết nối máy chủ. Cậu kiểm tra lại server nhé.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#008061] focus:bg-white focus:ring-4 focus:ring-[#F47B20]/20";
  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <AuthShell mode="register">
      <style>{stepAnimation}</style>

      {/* Tiến trình: 3 đoạn cam, xanh, đỏ */}
      <ol
        className="mb-6 grid grid-cols-3 gap-2"
        aria-label="Tiến trình đăng ký"
      >
        {steps.map((item, index) => {
          const reached = index <= step;
          return (
            <li
              key={item.title}
              aria-current={index === step ? "step" : undefined}
            >
              <span
                className={`block h-1.5 rounded-full transition-colors duration-300 ${
                  reached ? stepColors[index] : "bg-slate-200"
                }`}
              />
              <span
                className={`mt-1.5 block text-xs ${
                  index === step
                    ? "font-bold text-slate-900"
                    : "font-medium text-slate-400"
                }`}
              >
                {item.title}
              </span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">{steps[step].hint}</p>

        {/* key giúp mỗi bước trượt vào lại một lần khi chuyển */}
        <div key={step} className="dtm-step space-y-4">
          {step === 0 && (
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="employeeId" className={labelClass}>
                  Mã nhân viên
                </label>
                <input
                  id="employeeId"
                  autoComplete="username"
                  autoFocus
                  required
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  placeholder="Nhập mã nhân viên"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className={labelClass}>
                  Chức danh
                </label>
                <select
                  id="jobTitle"
                  required
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  className={inputClass}
                >
                  {jobTitles.map((job) => (
                    <option key={job.value} value={job.value}>
                      {job.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="password" className={labelClass}>
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={inputClass}
                />
              </div>

              {/* Nhắc lại thông tin đã nhập để người dùng yên tâm */}
              <p className="rounded-xl bg-[#008061]/8 px-4 py-3 text-xs leading-5 text-slate-600">
                <span className="font-bold text-slate-900">{employeeId}</span>
                {" - "}
                <span className="font-bold text-slate-900">
                  {fullName || "bạn"}
                </span>{" "}
                ({jobTitle})
                <br />
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-[#008061]" />
                  <span className="font-bold text-slate-900">{email}</span>
                </span>
              </p>
            </>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F47B20]/20 disabled:opacity-60"
            >
              Quay lại
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-xl bg-[#008061] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#008061]/20 transition hover:bg-[#006b50] focus:outline-none focus:ring-4 focus:ring-[#F47B20]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLastStep
              ? loading
                ? "Đang tạo tài khoản..."
                : "Tạo tài khoản"
              : "Tiếp tục"}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-bold text-[#008061] hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
