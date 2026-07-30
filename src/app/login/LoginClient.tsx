"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error("ایمیل یا رمز عبور اشتباه است");
      return;
    }
    toast.success("خوش آمدید");
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <div className="absolute left-4 top-4 z-10"><ThemeToggle /></div>
      <div className="blob animate-float -top-24 right-1/4 h-72 w-72 bg-rose-500/25" />
      <div className="blob animate-float delay-3 -bottom-24 left-1/4 h-72 w-72 bg-plum-500/25" />
      <div className="blob animate-float delay-5 top-1/3 left-0 h-56 w-56 bg-sky-500/20" />

      <div className="card-glow w-full max-w-md animate-fade-up p-7 sm:p-8">
        <div className="mb-7 text-center">
          <Link href="/"><Wordmark className="justify-center" /></Link>
          <span className="eyebrow mt-5 animate-fade-up delay-1"><Sparkles size={13} /> خوش برگشتی</span>
          <h1 className="mt-4 animate-fade-up delay-2 text-2xl font-black sm:text-3xl">ورود به <span className="text-gradient">حساب کاربری</span></h1>
          <p className="mt-2 animate-fade-up delay-3 text-sm text-white/55">مدیریت و رزرو آنلاین سالن زیبایی</p>
        </div>

        <form onSubmit={onSubmit} className="animate-fade-up delay-4 space-y-4">
          <div>
            <label className="label" htmlFor="email">ایمیل</label>
            <input
              id="email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input text-left"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">رمز عبور</label>
            <input
              id="password"
              type="password"
              dir="ltr"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input text-left"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-rose w-full py-3 text-base">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            ورود
          </button>
        </form>

        <div className="divider my-5" />
        <p className="text-center text-sm text-white/55">
          حساب ندارید؟{" "}
          <Link href="/register" className="font-semibold text-rose-300 hover:text-rose-200">
            <Sparkles size={13} className="ml-1 inline" />
            ثبت‌نام مشتری
          </Link>
        </p>

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-[11px] leading-5 text-white/45">
          <p className="mb-1 font-bold text-white/60">حساب‌های دمو — رمز همه: <span dir="ltr" className="text-rose-300">1234</span></p>
          <p>مدیریت سالن: <span dir="ltr" className="text-white/70">admin@kia.local</span></p>
          <p>خدمت‌دهنده: <span dir="ltr" className="text-white/70">sara@kia.local</span></p>
          <p>مدیریت پلتفرم: <span dir="ltr" className="text-white/70">platform@salon.local</span></p>
        </div>
      </div>
    </div>
  );
}
