"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ClipboardList, AlertTriangle, Crown, ArrowLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils";

type Row = {
  id: string; name: string; phone: string; loyaltyTier: string; loyaltyPoints: number;
  hairFormula: string | null; allergies: string | null;
  _count: { appointments: number };
};

const TIER: Record<string, { label: string; cls: string }> = {
  GOLD: { label: "طلایی", cls: "text-gold-300 bg-gold-400/10 border-gold-400/20" },
  SILVER: { label: "نقره‌ای", cls: "text-sky-200 bg-sky-400/10 border-sky-400/20" },
  BRONZE: { label: "برنزی", cls: "text-coral-200 bg-coral-400/10 border-coral-400/20" },
};

export function CustomersClient({ initial }: { initial: Row[] }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim();
    if (!s) return initial;
    return initial.filter((r) => r.name.includes(s) || r.phone.includes(s));
  }, [q, initial]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام یا شماره…" className="input pr-9" />
      </div>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-white/45">
          <ClipboardList size={32} className="mx-auto text-white/25" />
          <p className="mt-3">{initial.length === 0 ? "هنوز مشتری‌ای ثبت نشده است." : "موردی یافت نشد."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r, i) => {
            const tier = TIER[r.loyaltyTier] ?? TIER.BRONZE;
            return (
              <Link key={r.id} href={`/admin/customers/${r.id}`}
                className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-plum-400/30 animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-plum-gradient font-bold text-white">{r.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold">
                    {r.name}
                    {r.allergies && <span title="حساسیت ثبت‌شده"><AlertTriangle size={13} className="text-amber-400" /></span>}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45" dir="ltr">{r.phone}</p>
                </div>
                <div className="hidden text-center sm:block">
                  <p className="text-sm font-bold text-mint-300">{formatNumber(r._count.appointments)}</p>
                  <p className="text-[10px] text-white/40">نوبت</p>
                </div>
                <span className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${tier.cls}`}>
                  <Crown size={11} /> {tier.label} • {formatNumber(r.loyaltyPoints)}
                </span>
                <ArrowLeft size={16} className="shrink-0 text-white/30 transition group-hover:-translate-x-1 group-hover:text-plum-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
