import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import { formatPrice, formatNumber, pricingModeLabel, toJalali } from "@/lib/utils";
import { Wallet, TrendingUp, Scissors, Users } from "lucide-react";
import { FinanceByLineChart } from "./FinanceByLineChart";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, lines, providers] = await Promise.all([
    prisma.payment.findMany({
      where: { salonId },
      include: { appointment: { include: { line: { select: { id: true, name: true, pricingMode: true } }, provider: { select: { id: true, title: true } } } } },
    }),
    prisma.line.findMany({ where: { salonId }, orderBy: { order: "asc" } }),
    prisma.provider.findMany({ where: { salonId }, orderBy: { createdAt: "asc" } }),
  ]);

  // overall
  const totalGross = payments.reduce((s, p) => s + p.amount, 0);
  const totalSalon = payments.reduce((s, p) => s + p.salonShare, 0);
  const totalProvider = payments.reduce((s, p) => s + p.providerShare, 0);
  const monthPayments = payments.filter((p) => p.createdAt >= monthStart);
  const monthSalon = monthPayments.reduce((s, p) => s + p.salonShare, 0);

  // rent income (RENT lines pay fixed monthly rent)
  const rentLines = lines.filter((l) => l.pricingMode === "RENT" && l.active);
  const rentIncome = rentLines.reduce((s, l) => s + l.rentAmount, 0);

  // per-line breakdown
  const byLine = lines.map((line) => {
    const lp = payments.filter((p) => p.appointment?.line?.id === line.id);
    const gross = lp.reduce((s, p) => s + p.amount, 0);
    const salon = lp.reduce((s, p) => s + p.salonShare, 0);
    const provider = lp.reduce((s, p) => s + p.providerShare, 0);
    const rent = line.pricingMode === "RENT" && line.active ? line.rentAmount : 0;
    return { id: line.id, name: line.name, pricingMode: line.pricingMode, count: lp.length, gross, salon, provider, rent, totalSalon: salon + rent };
  });

  // per-provider breakdown
  const byProvider = providers.map((pr) => {
    const pp = payments.filter((p) => p.appointment?.provider?.id === pr.id);
    const gross = pp.reduce((s, p) => s + p.amount, 0);
    const provider = pp.reduce((s, p) => s + p.providerShare, 0);
    const salon = pp.reduce((s, p) => s + p.salonShare, 0);
    return { id: pr.id, title: pr.title, count: pp.length, gross, provider, salon };
  });

  const chartData = byLine.map((l) => ({ name: l.name, salon: l.salon, provider: l.provider }));

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-60 w-60 bg-rose-500/20" />
      <div className="blob left-1/4 -top-10 h-52 w-52 bg-plum-500/15" />

      <div className="animate-fade-up">
        <span className="eyebrow"><Wallet size={14} /> گزارش مالی</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          درآمد و <span className="text-gradient">تفکیک مالی</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">درآمد سالن، سهم خدمت‌دهنده‌ها و تفکیک هر لاین — {toJalali(now)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="گردش مالی کل" value={formatPrice(totalGross)} icon={Wallet} accent="rose" hint={`${payments.length} تراکنش`} />
        <StatCard label="سهم سالن (کل)" value={formatPrice(totalSalon)} icon={TrendingUp} accent="plum" hint="از خدمات درصدی" />
        <StatCard label="سهم خدمت‌دهنده‌ها" value={formatPrice(totalProvider)} icon={Users} accent="sky" />
        <StatCard label="اجاره ماهانه لاین‌ها" value={formatPrice(rentIncome)} icon={Scissors} accent="gold" hint={`${rentLines.length} لاین اجاره‌ای`} />
      </div>

      <div className="card-glow relative overflow-hidden p-6 animate-fade-up delay-1">
        <div className="blob -left-8 -bottom-10 h-40 w-40 bg-mint-500/15" />
        <h2 className="relative mb-4 font-black">تفکیک درآمد به‌ازای هر لاین</h2>
        <div className="relative">
          <FinanceByLineChart data={chartData} />
        </div>
      </div>

      {/* per-line table */}
      <div className="card overflow-x-auto p-2 sm:p-4 animate-fade-up delay-2">
        <h2 className="mb-3 px-2 pt-2 font-black">گزارش مالی هر بخش (لاین)</h2>
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-right text-xs text-white/40">
              <th className="p-3 font-medium">لاین</th>
              <th className="p-3 font-medium">حالت</th>
              <th className="p-3 font-medium">نوبت</th>
              <th className="p-3 font-medium">گردش</th>
              <th className="p-3 font-medium">سهم خدمت‌دهنده</th>
              <th className="p-3 font-medium">سهم سالن (خدمت)</th>
              <th className="p-3 font-medium">اجاره ماهانه</th>
              <th className="p-3 font-medium">درآمد سالن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {byLine.map((l) => (
              <tr key={l.id} className="text-white/80 transition hover:bg-white/[0.03]">
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3 text-white/50">{pricingModeLabel(l.pricingMode)}</td>
                <td className="p-3 text-white/60">{formatNumber(l.count)}</td>
                <td className="p-3 text-white/70">{formatPrice(l.gross)}</td>
                <td className="p-3 text-sky-300">{formatPrice(l.provider)}</td>
                <td className="p-3 text-plum-300">{formatPrice(l.salon)}</td>
                <td className="p-3 text-gold-300">{l.rent ? formatPrice(l.rent) : "—"}</td>
                <td className="p-3 font-bold text-rose-300">{formatPrice(l.totalSalon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* per-provider table */}
      <div className="card overflow-x-auto p-2 sm:p-4 animate-fade-up delay-3">
        <h2 className="mb-3 px-2 pt-2 font-black">گزارش مالی هر خدمت‌دهنده</h2>
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-right text-xs text-white/40">
              <th className="p-3 font-medium">خدمت‌دهنده</th>
              <th className="p-3 font-medium">نوبت</th>
              <th className="p-3 font-medium">گردش</th>
              <th className="p-3 font-medium">درآمد خدمت‌دهنده</th>
              <th className="p-3 font-medium">سهم سالن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {byProvider.map((p) => (
              <tr key={p.id} className="text-white/80 transition hover:bg-white/[0.03]">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3 text-white/60">{formatNumber(p.count)}</td>
                <td className="p-3 text-white/70">{formatPrice(p.gross)}</td>
                <td className="p-3 text-sky-300">{formatPrice(p.provider)}</td>
                <td className="p-3 font-bold text-rose-300">{formatPrice(p.salon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
