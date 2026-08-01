"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, NotebookPen, FileText, CalendarClock } from "lucide-react";
import { formatNumber, toJalali } from "@/lib/utils";

type Row = {
  id: string; name: string; phone: string;
  visits: number; lastVisit: string | null; notes: number; hasRecord: boolean;
};

export function ProviderCustomersClient({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const t = q.trim();
    if (!t) return rows;
    return rows.filter((r) => r.name.includes(t) || r.phone.includes(t));
  }, [q, rows]);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی نام یا موبایل…"
          className="input w-full py-3 pr-10"
        />
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-sm text-white/45">
          {rows.length === 0 ? "هنوز به مشتری‌ای خدمت نداده‌اید." : "موردی پیدا نشد."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <Link
              key={r.id}
              href={`/provider/customers/${r.id}`}
              className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-plum-400/30"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-plum-gradient text-lg font-black text-white">{r.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold">{r.name}</p>
                  {r.hasRecord && <FileText size={13} className="shrink-0 text-mint-300" aria-label="پرونده تکمیل شده" />}
                </div>
                <p className="truncate text-xs text-white/45" dir="ltr">{r.phone}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                  <span className="flex items-center gap-1"><CalendarClock size={12} /> {formatNumber(r.visits)} نوبت</span>
                  {r.notes > 0 && <span className="flex items-center gap-1 text-rose-300"><NotebookPen size={12} /> {formatNumber(r.notes)} یادداشت</span>}
                  {r.lastVisit && <span>آخرین: {toJalali(new Date(r.lastVisit))}</span>}
                </div>
              </div>
              <ChevronLeft size={18} className="shrink-0 text-white/30 transition group-hover:text-plum-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
