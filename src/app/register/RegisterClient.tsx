"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, UserPlus, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("رمز عبور حداقل ۶ کاراکتر");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ثبت‌نام ناموفق");
      toast.success("ثبت‌نام انجام شد. وارد شوید.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <div className="absolute left-4 top-4 z-10"><ThemeToggle /></div>
      <div className="blob animate-float -top-24 left-1/4 h-72 w-72 bg-plum-500/25" />
      <div className="blob animate-float delay-3 -bottom-24 right-1/4 h-72 w-72 bg-rose-500/25" />
      <div className="blob animate-float delay-5 top-1/3 right-0 h-56 w-56 bg-coral-500/20" />

      <div className="card-glow w-full max-w-md animate-fade-up p-7 sm:p-8">
        <div className="mb-6 text-center">
          <Link href="/"><Wordmark className="justify-center" /></Link>
          <span className="eyebrow mt-5 animate-fade-up delay-1"><Sparkles size={13} /> عضویت رایگان</span>
          <h1 className="mt-4 animate-fade-up delay-2 text-2xl font-black sm:text-3xl">ثبت‌نام <span className="text-gradient">مشتری</span></h1>
          <p className="mt-2 animate-fade-up delay-3 text-sm text-white/55">برای رزرو آنلاین نوبت حساب بسازید</p>
        </div>

        <form onSubmit={onSubmit} className="animate-fade-up delay-4 space-y-4">
          <div>
            <label className="label">نام و نام خانوادگی</label>
            <input required value={form.name} onChange={set("name")} className="input" placeholder="مثلاً نگار محمدی" />
          </div>
          <div>
            <label className="label">ایمیل</label>
            <input type="email" dir="ltr" required value={form.email} onChange={set("email")} className="input text-left" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">شماره موبایل</label>
            <input dir="ltr" required value={form.phone} onChange={set("phone")} className="input text-left" placeholder="09xxxxxxxxx" />
          </div>
          <div>
            <label className="label">رمز عبور</label>
            <input type="password" dir="ltr" required value={form.password} onChange={set("password")} className="input text-left" placeholder="حداقل ۶ کاراکتر" />
          </div>
          <button type="submit" disabled={loading} className="btn-rose w-full py-3 text-base">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            ثبت‌نام
          </button>
        </form>

        <div className="divider my-5" />
        <p className="text-center text-sm text-white/55">
          حساب دارید؟{" "}
          <Link href="/login" className="font-semibold text-rose-300 hover:text-rose-200">ورود</Link>
        </p>
      </div>
    </div>
  );
}
