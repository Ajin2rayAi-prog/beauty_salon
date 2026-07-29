"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import { Wordmark } from "@/components/Logo";

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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(60%_80%_at_50%_0%,#3a1142_0%,#160a1c_60%)] px-4 py-12">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-plum-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="card w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <Link href="/"><Wordmark className="justify-center" /></Link>
          <h1 className="mt-4 text-xl font-extrabold">ثبت‌نام مشتری</h1>
          <p className="mt-1 text-sm text-white/50">برای رزرو آنلاین نوبت حساب بسازید</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
          <button type="submit" disabled={loading} className="btn-rose w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            ثبت‌نام
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-white/55">
          حساب دارید؟{" "}
          <Link href="/login" className="font-semibold text-rose-300 hover:text-rose-200">ورود</Link>
        </p>
      </div>
    </div>
  );
}
