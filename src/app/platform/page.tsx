import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatNumber, toJalali } from "@/lib/utils";
import Link from "next/link";
import { Building2, Store, Users, Wallet, BadgeCheck, CalendarCheck, ArrowLeft, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  await requireRole([ROLES.PLATFORM]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [tenants, salons, activeSalons, providers, appts, grossMonth, licenses, recentTenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.salon.count(),
      prisma.salon.count({ where: { active: true } }),
      prisma.provider.count(),
      prisma.appointment.count({ where: { createdAt: { gte: monthStart } } }),
      // platform-wide gross turnover this month (all salons)
      prisma.payment.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: monthStart } } }),
      prisma.license.findMany({ include: { tenant: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { salons: true, users: true } } },
      }),
    ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const licenseRevenue = licenses
    .filter((l) => l.status === "ACTIVE")
    .reduce((s, l) => s + (l.priceIrr || 0), 0);

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-64 w-64 bg-rose-500/15" />
      <div className="blob delay-3 left-1/3 top-40 h-56 w-56 bg-plum-500/10" />

      <div className="animate-fade-up">
        <span className="eyebrow"><LayoutDashboard size={13} /> مدیریت پلتفرم</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">داشبورد <span className="text-gradient">پلتفرم</span></h1>
        <p className="mt-2 text-sm text-white/55">نمای کلی همه کارفرماها، سالن‌ها و لایسنس‌ها</p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="کارفرماها" value={formatNumber(tenants)} icon={Building2} accent="rose" hint="Tenant" />
        <StatCard label="سالن‌ها" value={formatNumber(salons)} icon={Store} accent="plum" hint={`${formatNumber(activeSalons)} فعال`} />
        <StatCard label="خدمت‌دهنده‌ها" value={formatNumber(providers)} icon={Users} accent="sky" hint="کل پلتفرم" />
        <StatCard label="نوبت‌های این ماه" value={formatNumber(appts)} icon={CalendarCheck} accent="coral" />
      </div>

      <div className="relative grid gap-4 sm:grid-cols-3">
        <StatCard label="درآمد لایسنس فعال" value={formatPrice(licenseRevenue)} icon={BadgeCheck} accent="mint" hint={`${formatNumber(activeLicenses)} لایسنس فعال`} />
        <StatCard label="گردش کل سالن‌ها (ماه)" value={formatPrice(grossMonth._sum.amount ?? 0)} icon={Wallet} accent="gold" hint="مجموع تراکنش‌ها" />
        <StatCard label="کل لایسنس‌ها" value={formatNumber(licenses.length)} icon={BadgeCheck} accent="plum" />
      </div>

      {/* Recent tenants */}
      <div className="card animate-fade-up delay-2 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">آخرین کارفرماها</h2>
          <Link href="/platform/tenants" className="inline-flex items-center gap-1 text-xs text-rose-300 hover:underline">
            مدیریت کارفرماها <ArrowLeft size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-white/40">
                <th className="pb-3 font-medium">کارفرما</th>
                <th className="pb-3 font-medium">سالن‌ها</th>
                <th className="pb-3 font-medium">کاربران</th>
                <th className="pb-3 font-medium">تلفن</th>
                <th className="pb-3 font-medium">تاریخ ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {recentTenants.map((t) => (
                <tr key={t.id} className="text-white/80 transition hover:bg-white/[0.03]">
                  <td className="rounded-r-xl py-3 pr-2 font-semibold">{t.name}</td>
                  <td className="py-3 text-white/60">{formatNumber(t._count.salons)}</td>
                  <td className="py-3 text-white/60">{formatNumber(t._count.users)}</td>
                  <td className="py-3 text-white/60" dir="ltr">{t.phone ?? "—"}</td>
                  <td className="rounded-l-xl py-3 pl-2 text-white/60">{toJalali(t.createdAt)}</td>
                </tr>
              ))}
              {recentTenants.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">هنوز کارفرمایی ثبت نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Licenses snapshot */}
      <div className="card animate-fade-up delay-3 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">لایسنس‌ها</h2>
          <Link href="/platform/licenses" className="inline-flex items-center gap-1 text-xs text-rose-300 hover:underline">
            مدیریت لایسنس‌ها <ArrowLeft size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-white/40">
                <th className="pb-3 font-medium">کارفرما</th>
                <th className="pb-3 font-medium">پلن</th>
                <th className="pb-3 font-medium">قیمت</th>
                <th className="pb-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {licenses.slice(0, 6).map((l) => (
                <tr key={l.id} className="text-white/80 transition hover:bg-white/[0.03]">
                  <td className="rounded-r-xl py-3 pr-2 font-semibold">{l.tenant.name}</td>
                  <td className="py-3 text-white/60">{l.plan}</td>
                  <td className="py-3 text-white/60">{formatPrice(l.priceIrr)}</td>
                  <td className="rounded-l-xl py-3 pl-2"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {licenses.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-white/40">هنوز لایسنسی صادر نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
