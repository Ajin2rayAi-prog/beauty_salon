"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice, formatNumber } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

type Appt = {
  id: string; startAt: string; endAt: string; status: string; payStatus: string; amount: number;
  customer: { name: string }; service: { name: string } | null; line: { name: string };
};

const WD = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
const statusColor: Record<string, string> = {
  PENDING: "border-amber-400/40 bg-amber-400/15 text-amber-100 shadow-[0_4px_16px_-6px_rgba(251,191,36,0.6)]",
  CONFIRMED: "border-emerald-400/40 bg-emerald-400/15 text-emerald-100 shadow-[0_4px_16px_-6px_rgba(52,211,153,0.6)]",
  DONE: "border-sky-400/40 bg-sky-400/15 text-sky-100 shadow-[0_4px_16px_-6px_rgba(56,189,248,0.6)]",
  CANCELLED: "border-red-400/30 bg-red-400/10 text-red-200 opacity-50",
  NO_SHOW: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300 opacity-50",
};

function startOfIranianWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const irIdx = (x.getDay() + 1) % 7; // Sat=0
  x.setDate(x.getDate() - irIdx);
  return x;
}

export function ProviderCalendar({ providerId }: { providerId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfIranianWeek(new Date()));
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(false);
  // Mobile day-view: which weekday (0=Sat..6=Fri) is selected. Defaults to today.
  const [dayIdx, setDayIdx] = useState(() => (new Date().getDay() + 1) % 7);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  useEffect(() => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = new Date(weekStart.getTime() + 7 * 86400000).toISOString();
    fetch(`/api/provider/appointments?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setAppts(d.appointments ?? []))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

  function shift(n: number) {
    const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d);
  }

  const fmtDay = (d: Date) => new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(d);

  return (
    <div className="card animate-fade-up overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] p-4">
        <button onClick={() => shift(-1)} className="btn-outline p-2"><ChevronRight size={18} /></button>
        <div className="flex items-center gap-2 text-sm font-bold">
          {loading && <Loader2 size={15} className="animate-spin text-rose-300" />}
          <span className="text-gradient">{fmtDay(days[0])} تا {fmtDay(days[6])}</span>
        </div>
        <button onClick={() => shift(1)} className="btn-outline p-2"><ChevronLeft size={18} /></button>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[900px]">
          {/* header row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.06]">
            <div className="p-2" />
            {days.map((d, i) => {
              const now = new Date();
              const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
              return (
                <div key={i} className={`border-r border-white/[0.04] p-2 text-center transition ${isToday ? "bg-rose-500/10" : ""}`}>
                  <p className={`text-xs font-bold ${isToday ? "text-rose-200" : ""}`}>{WD[i]}</p>
                  <p className={`text-[11px] ${isToday ? "font-bold text-rose-300" : "text-white/40"}`}>{fmtDay(d)}</p>
                </div>
              );
            })}
          </div>

          {/* hour rows */}
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.04]">
                <div className="p-2 text-left text-[11px] font-semibold text-white/35" dir="ltr">{String(h).padStart(2, "0")}:00</div>
                {days.map((_, i) => <div key={i} className="h-16 border-r border-white/[0.04] transition hover:bg-white/[0.02]" />)}
              </div>
            ))}

            {/* appointments overlay */}
            {days.map((day, di) => {
              const dayAppts = appts.filter((a) => {
                const s = new Date(a.startAt);
                return s.getFullYear() === day.getFullYear() && s.getMonth() === day.getMonth() && s.getDate() === day.getDate();
              });
              return dayAppts.map((a) => {
                const s = new Date(a.startAt); const e = new Date(a.endAt);
                const startH = s.getHours() + s.getMinutes() / 60;
                const durH = (e.getTime() - s.getTime()) / 3600000;
                const top = (startH - 8) * 64; // 64px per hour (h-16)
                const height = Math.max(28, durH * 64);
                return (
                  <div
                    key={a.id}
                    className={`absolute rounded-xl border p-1.5 text-[10px] leading-4 backdrop-blur-sm transition hover:z-10 hover:scale-[1.03] ${statusColor[a.status] ?? "border-white/20 bg-white/5"}`}
                    style={{
                      top: `${top + 33}px`,
                      height: `${height - 3}px`,
                      right: `calc(${(di / 7) * 100}% + 60px - ${60 * (di / 7)}px + 2px)`,
                      width: `calc(${100 / 7}% - ${60 / 7}px - 6px)`,
                      overflow: "hidden",
                    }}
                    title={`${a.customer.name} — ${a.service?.name ?? a.line.name}`}
                  >
                    <p className="truncate font-bold">{new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(s)} {a.customer.name}</p>
                    <p className="truncate opacity-70">{a.service?.name ?? a.line.name}</p>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile day view (below lg) — no horizontal scrolling ── */}
      <div className="lg:hidden">
        {/* day picker strip */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.06] p-3">
          {days.map((d, i) => {
            const now = new Date();
            const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
            const active = i === dayIdx;
            return (
              <button
                key={i}
                onClick={() => setDayIdx(i)}
                className={`flex min-w-[3.5rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2.5 py-2 text-center transition active:scale-95 ${
                  active
                    ? "bg-rose-gradient text-white shadow-[0_8px_20px_-8px_rgba(255,77,151,0.6)]"
                    : "bg-white/[0.04] text-white/60"
                }`}
              >
                <span className="text-[11px] font-bold">{WD[i].replace("‌شنبه", "ش").replace("شنبه", "ش")}</span>
                <span className={`text-[11px] ${active ? "text-white/90" : isToday ? "text-rose-300" : "text-white/45"}`}>{fmtDay(d)}</span>
              </button>
            );
          })}
        </div>

        {/* selected day's appointments */}
        <div className="space-y-2.5 p-4">
          {(() => {
            const day = days[dayIdx];
            const list = appts
              .filter((a) => {
                const s = new Date(a.startAt);
                return s.getFullYear() === day.getFullYear() && s.getMonth() === day.getMonth() && s.getDate() === day.getDate();
              })
              .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
            if (loading) {
              return <div className="flex justify-center py-10 text-rose-300"><Loader2 className="animate-spin" /></div>;
            }
            if (list.length === 0) {
              return <p className="py-10 text-center text-sm text-white/40">نوبتی برای این روز ثبت نشده است.</p>;
            }
            return list.map((a) => {
              const s = new Date(a.startAt); const e = new Date(a.endAt);
              const t = (d: Date) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(d);
              return (
                <div key={a.id} className={`flex items-stretch gap-3 rounded-2xl border p-3 ${statusColor[a.status] ?? "border-white/20 bg-white/5"}`}>
                  <div className="flex flex-col items-center justify-center border-l border-white/15 pl-3 text-center" dir="ltr">
                    <span className="text-sm font-black leading-tight">{t(s)}</span>
                    <span className="text-[10px] opacity-60">{t(e)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{a.customer.name}</p>
                    <p className="truncate text-[12px] opacity-75">{a.service?.name ?? a.line.name}</p>
                    <p className="mt-0.5 text-[11px] opacity-60">{formatPrice(a.amount)}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
