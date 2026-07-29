import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime, getRoleLabel } from "@/lib/utils";
import Link from "next/link";
import { Wallet, CalendarCheck, Users, Scissors, Clock, TrendingUp, ArrowLeft, Sparkles } from "lucide-react";
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
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-64 w-64 bg-rose-500/20" />
      <div className="blob left-1/3 -top-10 h-56 w-56 bg-plum-500/15" />

      <div className="animate-fade-up">
        <span className="eyebrow"><Sparkles size={14} /> پنل مدیریت</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          داشبورد <span className="text-gradient">مدیریت</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">{salon?.name} — نمای کلی درآمد، نوبت‌ها و عملکرد سالن.</p>
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
        <StatCard label="نوبت‌های این ماه" value={String(monthAppts)} icon={Clock} accent="coral" hint="جاری" />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="لاین‌های فعال" value={String(lines)} icon={Scissors} accent="mint" />
        <StatCard label="خدمت‌دهنده‌های فعال" value={String(providers)} icon={Users} accent="gold" />
        <StatCard label="اعتبار پیامک" value={formatPrice(salon?.smsCredit ?? 0)} icon={Wallet} accent="amber" hint="تومان" />
      </div>

      {/* Revenue chart */}
      <div className="card-glow relative overflow-hidden p-6 animate-fade-up delay-2">
        <div className="blob -left-8 -bottom-10 h-40 w-40 bg-sky-500/15" />
        <div className="relative mb-4 flex items-center justify-between">
          <h2 className="font-black">درآمد ۷ روز اخیر</h2>
          <Link href="/admin/finance" className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 hover:underline">
            گزارش کامل <ArrowLeft size={13} />
          </Link>
        </div>
        <div className="relative">
          <AdminDashboardChart data={series} />
        </div>
      </div>

      {/* Recent appointments */}
      <div className="card relative overflow-hidden p-6 animate-fade-up delay-3">
        <h2 className="mb-4 font-black">آخرین نوبت‌ها</h2>
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
                <tr key={a.id} className="text-white/80 transition hover:bg-white/[0.03]">
                  <td className="py-3 font-medium">{a.customer.name}</td>
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
