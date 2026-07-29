import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime, payMethodLabel } from "@/lib/utils";
import Link from "next/link";
import { CalendarHeart, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const user = await requireRole([ROLES.CUSTOMER]);

  // all Customer records bound to this user, then their appointments
  const customers = await prisma.customer.findMany({ where: { userId: user.id }, select: { id: true } });
  const ids = customers.map((c) => c.id);

  const appointments = ids.length
    ? await prisma.appointment.findMany({
        where: { customerId: { in: ids } },
        orderBy: { startAt: "desc" },
        include: { salon: true, line: true, provider: true, service: true },
      })
    : [];

  const now = new Date();
  const upcoming = appointments.filter((a) => a.startAt >= now && ["PENDING", "CONFIRMED"].includes(a.status));
  const past = appointments.filter((a) => !(a.startAt >= now && ["PENDING", "CONFIRMED"].includes(a.status)));

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden">
        <div className="blob -right-10 -top-14 h-52 w-52 bg-rose-500/20" />
        <div className="blob delay-3 left-10 -top-8 h-36 w-36 bg-plum-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow"><CalendarHeart size={14} /> پنل مشتری</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">نوبت‌های <span className="text-gradient">من</span></h1>
          <p className="mt-2 text-sm text-white/55">نوبت‌های پیش‌رو و تاریخچه شما.</p>
        </div>
      </div>

      <section className="animate-fade-up delay-1">
        <h2 className="mb-3 flex items-center gap-2 font-black">
          <span className="h-4 w-1 rounded-full bg-rose-gradient" /> پیش‌رو
        </h2>
        {upcoming.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-300"><CalendarHeart size={26} /></div>
            <p className="mt-3 text-white/45">نوبت پیش‌رویی ندارید.</p>
            <Link href="/" className="btn-rose mt-5 inline-block px-6 py-2.5 text-sm">رزرو نوبت جدید</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((a, i) => (
              <div key={a.id} className="card group animate-fade-up p-5 transition hover:-translate-y-1 hover:border-rose-400/30" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{a.service?.name ?? a.line.name}</h3>
                    <p className="mt-0.5 text-xs text-white/45">{a.line.name} • {a.provider.title}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-white/70">
                  <p className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/15 text-rose-300"><CalendarHeart size={14} /></span> {formatShortDate(a.startAt)} • {formatTime(a.startAt)}</p>
                  <p className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-plum-500/15 text-plum-300"><MapPin size={14} /></span> {a.salon.name}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="font-black text-rose-300">{formatPrice(a.amount)}</span>
                  <span className="text-xs text-white/40">{payMethodLabel(a.payMethod)}</span>
                  <StatusBadge status={a.payStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="animate-fade-up delay-2">
          <h2 className="mb-3 flex items-center gap-2 font-black text-white/75">
            <span className="h-4 w-1 rounded-full bg-white/25" /> تاریخچه
          </h2>
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-right text-xs text-white/45">
                  <th className="p-3 font-semibold">خدمت</th>
                  <th className="p-3 font-semibold">سالن</th>
                  <th className="p-3 font-semibold">تاریخ</th>
                  <th className="p-3 font-semibold">مبلغ</th>
                  <th className="p-3 font-semibold">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {past.map((a) => (
                  <tr key={a.id} className="text-white/75 transition hover:bg-white/[0.03]">
                    <td className="p-3 font-semibold">{a.service?.name ?? a.line.name}</td>
                    <td className="p-3 text-white/55">{a.salon.name}</td>
                    <td className="p-3 text-white/55">{formatShortDate(a.startAt)}</td>
                    <td className="p-3 font-bold text-rose-300">{formatPrice(a.amount)}</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
