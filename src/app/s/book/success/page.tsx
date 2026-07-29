import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, toJalali, formatTime } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ searchParams }: { searchParams: { id?: string } }) {
  const appt = searchParams.id
    ? await prisma.appointment.findUnique({
        where: { id: searchParams.id },
        include: { salon: true, line: true, provider: true, service: true, customer: true },
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-16">
        <div className="card w-full p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
          <h1 className="mt-4 text-2xl font-extrabold">نوبت شما ثبت شد</h1>
          {appt ? (
            <div className="mt-6 space-y-3 text-right">
              <div className="card border-white/[0.06] bg-white/[0.02] p-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-white/40">سالن</p><p className="mt-1 font-semibold">{appt.salon.name}</p></div>
                  <div><p className="text-white/40">لاین</p><p className="mt-1 font-semibold">{appt.line.name}</p></div>
                  <div><p className="text-white/40">خدمت</p><p className="mt-1 font-semibold">{appt.service?.name ?? "—"}</p></div>
                  <div><p className="text-white/40">خدمت‌دهنده</p><p className="mt-1 font-semibold">{appt.provider.title}</p></div>
                  <div><p className="text-white/40">تاریخ</p><p className="mt-1 font-semibold">{toJalali(appt.startAt)}</p></div>
                  <div><p className="text-white/40">ساعت</p><p className="mt-1 font-semibold">{formatTime(appt.startAt)}</p></div>
                  <div><p className="text-white/40">مبلغ</p><p className="mt-1 font-semibold text-rose-300">{formatPrice(appt.amount)}</p></div>
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
