import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, toJalali, formatTime } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ searchParams }: { searchParams: { id?: string } }) {
  const appt = searchParams.id
    ? await prisma.appointment.findUnique({
        where: { id: searchParams.id },
        include: { salon: true, line: true, provider: true, service: true, customer: true },
      })
    : null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-16">
        <div className="blob animate-float -right-10 top-10 h-56 w-56 bg-mint-500/25" />
        <div className="blob animate-float delay-3 -left-10 bottom-10 h-56 w-56 bg-rose-500/20" />
        <div className="card-glow relative w-full p-8 text-center animate-fade-up">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 animate-pulse-glow">
            <CheckCircle2 size={44} className="text-emerald-400" />
          </div>
          <span className="eyebrow mt-5"><Sparkles size={13} /> تبریک</span>
          <h1 className="mt-3 text-3xl font-black">نوبت شما <span className="text-gradient">ثبت شد</span> 🎉</h1>
          {appt ? (
            <div className="mt-7 space-y-4 text-right">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-white/40">سالن</p><p className="mt-1 font-bold">{appt.salon.name}</p></div>
                  <div><p className="text-white/40">لاین</p><p className="mt-1 font-bold">{appt.line.name}</p></div>
                  <div><p className="text-white/40">خدمت</p><p className="mt-1 font-bold">{appt.service?.name ?? "—"}</p></div>
                  <div><p className="text-white/40">خدمت‌دهنده</p><p className="mt-1 font-bold">{appt.provider.title}</p></div>
                  <div><p className="text-white/40">تاریخ</p><p className="mt-1 font-bold">{toJalali(appt.startAt)}</p></div>
                  <div><p className="text-white/40">ساعت</p><p className="mt-1 font-bold">{formatTime(appt.startAt)}</p></div>
                  <div><p className="text-white/40">مبلغ</p><p className="mt-1 font-black text-rose-300">{formatPrice(appt.amount)}</p></div>
                  <div><p className="text-white/40">وضعیت</p><p className="mt-1"><StatusBadge status={appt.status} /></p></div>
                </div>
              </div>
              <p className="text-center text-xs text-white/45">
                {appt.payMethod === "ONLINE" ? "بیعانه پرداخت شد؛ مابقی هنگام مراجعه." : "پرداخت هنگام مراجعه انجام می‌شود."}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href={`/s/${appt.salon.slug}`} className="btn-outline px-5 py-2.5 text-sm">بازگشت به صفحه سالن</Link>
                <Link href="/customer" className="btn-rose px-5 py-2.5 text-sm">نوبت‌های من</Link>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-white/50">نوبت ثبت شد.</p>
          )}
        </div>
      </main>
    </div>
  );
}
