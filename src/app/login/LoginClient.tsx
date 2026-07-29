"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/Logo";

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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(60%_80%_at_50%_0%,#3a1142_0%,#160a1c_60%)] px-4 py-12">
      <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-plum-500/20 blur-3xl" />

      <div className="card w-full max-w-md animate-fade-up">
        <div className="mb-7 text-center">
          <Link href="/"><Wordmark className="justify-center" /></Link>
          <h1 className="mt-4 text-xl font-extrabold">ورود به حساب کاربری</h1>
          <p className="mt-1 text-sm text-white/50">مدیریت و رزرو آنلاین سالن زیبایی</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
          <button type="submit" disabled={loading} className="btn-rose w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            ورود
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-white/55">
          حساب ندارید؟{" "}
          <Link href="/register" className="font-semibold text-rose-300 hover:text-rose-200">
            <Sparkles size={13} className="ml-1 inline" />
            ثبت‌نام مشتری
          </Link>
        </p>

        <div className="mt-5 rounded-xl bg-white/[0.03] p-3 text-[11px] leading-5 text-white/40">
          <p className="mb-1 font-bold text-white/60">حساب‌های دمو (seed):</p>
          <p>مدیریت سالن: <span dir="ltr" className="text-white/70">admin@kia.local</span> / <span dir="ltr" className="text-white/70">Kia@123</span></p>
          <p>خدمت‌دهنده: <span dir="ltr" className="text-white/70">sara@kia.local</span> / <span dir="ltr" className="text-white/70">Kia@123</span></p>
        </div>
      </div>
    </div>
  );
}
