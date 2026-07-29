import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime, getRoleLabel } from "@/lib/utils";
import Link from "next/link";
import { Wallet, CalendarCheck, Users, Scissors, Clock, TrendingUp, ArrowLeft } from "lucide-react";
import { AdminDashboardChart } from "./AdminDashboardChart";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - 6); // last 7 days incl. today

  const [salon, lines, providers, apptsToday, monthAppts, paymentsMonth, recentAppts, last7Payments] =
    await Promise.all([
      prisma.salon.findUnique({ where: { id: salonId }, select: { name: true, smsCredit: true } }),
      prisma.line.count({ where: { salonId, active: true } }),
      prisma.provider.count({ where: { salonId, active: true } }),
      prisma.appointment.count({ where: { salonId, startAt: { gte: dayStart, lt: new Date(dayStart.getTime() + 86400000) } } }),
      prisma.appointment.count({ where: { salonId, startAt: { gte: monthStart } } }),
      prisma.payment.aggregate({
        _sum: { amount: true, salonShare: true, providerShare: true },
        _count: true,
        where: { salonId, createdAt: { gte: monthStart } },
      }),
      prisma.appointment.findMany({
        where: { salonId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { customer: true, provider: true, line: true, service: true },
      }),
      prisma.payment.findMany({
        where: { salonId, createdAt: { gte: weekStart } },
        select: { createdAt: true, amount: true, salonShare: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // build last-7-days series (salon revenue)
  const series: { label: string; salon: number; total: number }[] = [];
  const dayLabels = ["یک", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(dayStart);
    d.setDate(d.getDate() - i);
    const next = new Date(d.getTime() + 86400000);
    const inDay = last7Payments.filter((p) => p.createdAt >= d && p.createdAt < next);
    const salon = inDay.reduce((s, p) => s + p.salonShare, 0);
    const total = inDay.reduce((s, p) => s + p.amount, 0);
    // Iranian weekday: Sat=0..Fri=6 ; JS getDay Sun=0..Sat=6
    const irIdx = (new Date(d).getDay() + 1) % 7;
    series.push({ label: dayLabels[irIdx], salon, total });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">داشبورد مدیریت</h1>
        <p className="mt-1 text-sm text-white/50">{salon?.name}</p>
      </div>

      {/* Financial stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="درآمد سالن این ماه"
          value={formatPrice(paymentsMonth._sum.salonShare ?? 0)}
          icon={Wallet}
          accent="rose"
          hint={`${formatPrice(paymentsMonth._sum.amount ?? 0)} گردش کل`}
        />
        <StatCard
          label="سهم خدمت‌دهنده‌ها"
          value={formatPrice(paymentsMonth._sum.providerShare ?? 0)}
          icon={TrendingUp}
          accent="plum"
          hint={`${paymentsMonth._count} تراکنش`}
        />
        <StatCard label="نوبت‌های امروز" value={String(apptsToday)} icon={CalendarCheck} accent="sky" hint="امروز" />
        <StatCard label="نوبت‌های این ماه" value={String(monthAppts)} icon={Clock} accent="amber" hint="جاری" />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="لاین‌های فعال" value={String(lines)} icon={Scissors} accent="rose" />
        <StatCard label="خدمت‌دهنده‌های فعال" value={String(providers)} icon={Users} accent="plum" />
        <StatCard label="اعتبار پیامک" value={formatPrice(salon?.smsCredit ?? 0)} icon={Wallet} accent="amber" hint="تومان" />
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">درآمد ۷ روز اخیر</h2>
          <Link href="/admin/finance" className="inline-flex items-center gap-1 text-xs text-rose-300 hover:underline">
            گزارش کامل <ArrowLeft size={13} />
          </Link>
        </div>
        <AdminDashboardChart data={series} />
      </div>

      {/* Recent appointments */}
      <div className="card p-6">
        <h2 className="mb-4 font-extrabold">آخرین نوبت‌ها</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-white/40">
                <th className="pb-3 font-medium">مشتری</th>
                <th className="pb-3 font-medium">خدمت</th>
                <th className="pb-3 font-medium">خدمت‌دهنده</th>
                <th className="pb-3 font-medium">زمان</th>
                <th className="pb-3 font-medium">وضعیت</th>
                <th className="pb-3 font-medium">پرداخت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {recentAppts.map((a) => (
                <tr key={a.id} className="text-white/80">
                  <td className="py-3">{a.customer.name}</td>
                  <td className="py-3 text-white/60">{a.service?.name ?? a.line.name}</td>
                  <td className="py-3 text-white/60">{a.provider.title}</td>
                  <td className="py-3 text-white/60">{formatShortDate(a.startAt)} • {formatTime(a.startAt)}</td>
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3"><StatusBadge status={a.payStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
