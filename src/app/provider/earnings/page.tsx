import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { formatPrice, formatNumber, pricingModeLabel, formatShortDate } from "@/lib/utils";
import { Wallet, TrendingUp, CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderEarningsPage() {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, include: { lines: { include: { line: true } } } });
  if (!provider) throw new Error("پروفایل پیدا نشد");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const payments = await prisma.payment.findMany({
    where: { appointment: { providerId: provider.id } },
    include: { appointment: { include: { line: { select: { name: true, pricingMode: true } }, service: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const total = payments.reduce((s, p) => s + p.providerShare, 0);
  const month = payments.filter((p) => p.createdAt >= monthStart).reduce((s, p) => s + p.providerShare, 0);
  const count = payments.length;

  // my RENT lines: rent owed to salon
  const rentLines = provider.lines.filter((pl) => pl.line.pricingMode === "RENT");
  const monthlyRent = rentLines.reduce((s, pl) => s + pl.line.rentAmount, 0);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden">
        <div className="blob -right-8 -top-12 h-48 w-48 bg-mint-500/15" />
        <div className="blob delay-3 left-16 -top-8 h-36 w-36 bg-gold-400/15" />
        <div className="relative animate-fade-up">
          <span className="eyebrow"><Wallet size={14} /> کیف پول</span>
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">درآمد <span className="text-gradient">من</span></h1>
          <p className="mt-2 text-sm text-white/55">تسویه و سهم شما از خدمات انجام‌شده.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="درآمد کل" value={formatPrice(total)} icon={Wallet} accent="rose" hint={`${count} تراکنش`} />
        <StatCard label="درآمد این ماه" value={formatPrice(month)} icon={TrendingUp} accent="plum" />
        <StatCard label="تعداد خدمات" value={formatNumber(count)} icon={CalendarCheck} accent="sky" />
        {rentLines.length > 0 && <StatCard label="اجاره ماهانه من" value={formatPrice(monthlyRent)} icon={Wallet} accent="amber" hint="به سالن" />}
      </div>

      {rentLines.length > 0 && (
        <div className="card animate-fade-up delay-2 border-amber-400/25 bg-amber-400/[0.05] p-5">
          <h3 className="flex items-center gap-2 font-black text-amber-300"><Wallet size={16} /> لاین‌های اجاره‌ای شما</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            برای لاین(های) {rentLines.map((pl) => `«${pl.line.name}»`).join(" و ")} اجاره ثابت ماهانه پرداخت می‌کنید و کل درآمد خدمت این لاین‌ها مال شماست.
          </p>
        </div>
      )}

      <div className="card animate-fade-up delay-3 overflow-x-auto p-2 sm:p-4">
        <h2 className="mb-3 px-2 pt-2 text-lg font-black">تراکنش‌ها</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-right text-xs text-white/45">
              <th className="p-3 font-semibold">تاریخ</th>
              <th className="p-3 font-semibold">خدمت</th>
              <th className="p-3 font-semibold">لاین</th>
              <th className="p-3 font-semibold">گردش</th>
              <th className="p-3 font-semibold">سهم شما</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {payments.map((p) => (
              <tr key={p.id} className="text-white/80 transition hover:bg-white/[0.03]">
                <td className="p-3 text-white/60">{formatShortDate(p.createdAt)}</td>
                <td className="p-3 font-semibold">{p.appointment?.service?.name ?? "—"}</td>
                <td className="p-3 text-white/60">{p.appointment?.line?.name ?? "—"}<div className="text-[10px] text-white/35">{p.appointment?.line ? pricingModeLabel(p.appointment.line.pricingMode) : ""}</div></td>
                <td className="p-3 text-white/70">{formatPrice(p.amount)}</td>
                <td className="p-3 font-black text-rose-300">{formatPrice(p.providerShare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="py-8 text-center text-white/40">هنوز تراکنشی ندارید.</p>}
      </div>
    </div>
  );
}
