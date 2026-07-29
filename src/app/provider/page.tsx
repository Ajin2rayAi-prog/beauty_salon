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
      <div>
        <h1 className="text-2xl font-extrabold">سلام، {provider.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {provider.lines.map((pl) => <span key={pl.lineId} className="badge text-xs">{pl.line.name}</span>)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="نوبت امروز" value={String(todayAppts)} icon={CalendarCheck} accent="rose" hint="امروز" />
        <StatCard label="نوبت پیش‌رو" value={String(upcoming)} icon={Clock} accent="sky" hint="تأیید/انتظار" />
        <StatCard label="درآمد این ماه" value={formatPrice(monthPayments._sum.providerShare ?? 0)} icon={Wallet} accent="plum" hint={`${monthPayments._count} تراکنش`} />
        <StatCard label="نمونه‌کار" value={String(portfolioCount)} icon={Camera} accent="amber" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">نوبت‌های امروز</h2>
          <Link href="/provider/calendar" className="text-xs text-rose-300 hover:underline">تقویم کامل ←</Link>
        </div>
        {todayList.length === 0 ? (
          <p className="py-8 text-center text-white/40">امروز نوبتی ندارید.</p>
        ) : (
          <div className="space-y-3">
            {todayList.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div>
                  <p className="font-semibold">{a.customer.name}</p>
                  <p className="mt-0.5 text-xs text-white/45">{a.service?.name ?? a.line.name} • {a.line.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-rose-300">{formatTime(a.startAt)}</span>
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
