import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime } from "@/lib/utils";
import { Wallet, CalendarCheck, Clock, Camera } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const user = await requireRole([ROLES.PROVIDER]);

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: { lines: { include: { line: true } } },
  });
  if (!provider) throw new Error("پروفایل خدمت‌دهنده پیدا نشد");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const [todayAppts, upcoming, monthPayments, portfolioCount, todayList] = await Promise.all([
    prisma.appointment.count({ where: { providerId: provider.id, startAt: { gte: dayStart, lt: dayEnd }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.appointment.count({ where: { providerId: provider.id, startAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.payment.aggregate({ _sum: { providerShare: true }, _count: true, where: { salonId: provider.salonId, createdAt: { gte: monthStart }, appointment: { providerId: provider.id } } }),
    prisma.providerPortfolio.count({ where: { providerId: provider.id } }),
    prisma.appointment.findMany({
      where: { providerId: provider.id, startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: "asc" },
      include: { customer: true, service: true, line: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden">
        <div className="blob -right-10 -top-16 h-56 w-56 bg-rose-500/20" />
        <div className="blob delay-3 left-10 -top-10 h-40 w-40 bg-plum-500/20" />
        <div className="relative animate-fade-up">
          <span className="eyebrow">✨ پنل خدمت‌دهنده</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">سلام، <span className="text-gradient">{provider.title}</span> 👋</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {provider.lines.map((pl) => <span key={pl.lineId} className="badge text-xs text-rose-200">{pl.line.name}</span>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="نوبت امروز" value={String(todayAppts)} icon={CalendarCheck} accent="rose" hint="امروز" />
        <StatCard label="نوبت پیش‌رو" value={String(upcoming)} icon={Clock} accent="sky" hint="تأیید/انتظار" />
        <StatCard label="درآمد این ماه" value={formatPrice(monthPayments._sum.providerShare ?? 0)} icon={Wallet} accent="plum" hint={`${monthPayments._count} تراکنش`} />
        <StatCard label="نمونه‌کار" value={String(portfolioCount)} icon={Camera} accent="amber" />
      </div>

      <div className="card animate-fade-up delay-2 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">نوبت‌های امروز</h2>
          <Link href="/provider/calendar" className="text-xs font-semibold text-rose-300 hover:underline">تقویم کامل ←</Link>
        </div>
        {todayList.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-300"><CalendarCheck size={24} /></div>
            <p className="mt-3 text-white/45">امروز نوبتی ندارید.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayList.map((a, i) => (
              <div key={a.id} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-rose-400/30 hover:bg-white/[0.04] animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-gradient text-sm font-black text-white shadow-lg">{a.customer.name.charAt(0)}</span>
                  <div>
                    <p className="font-bold">{a.customer.name}</p>
                    <p className="mt-0.5 text-xs text-white/45">{a.service?.name ?? a.line.name} • {a.line.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/[0.04] px-3 py-1 text-sm font-bold text-rose-300">{formatTime(a.startAt)}</span>
                  <StatusBadge status={a.status} />
                  <StatusBadge status={a.payStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
