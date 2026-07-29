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
  PENDING: "border-amber-400/40 bg-amber-400/10",
  CONFIRMED: "border-emerald-400/40 bg-emerald-400/10",
  DONE: "border-sky-400/40 bg-sky-400/10",
  CANCELLED: "border-red-400/30 bg-red-400/5 opacity-50",
  NO_SHOW: "border-zinc-400/30 bg-zinc-400/5 opacity-50",
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
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <button onClick={() => shift(-1)} className="btn-ghost p-2"><ChevronRight size={18} /></button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {loading && <Loader2 size={15} className="animate-spin text-white/40" />}
          {fmtDay(days[0])} تا {fmtDay(days[6])}
        </div>
        <button onClick={() => shift(1)} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* header row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.06]">
            <div className="p-2" />
            {days.map((d, i) => (
              <div key={i} className="border-r border-white/[0.04] p-2 text-center">
                <p className="text-xs font-semibold">{WD[i]}</p>
                <p className="text-[11px] text-white/40">{fmtDay(d)}</p>
              </div>
            ))}
          </div>

          {/* hour rows */}
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.03]">
                <div className="p-2 text-left text-[11px] text-white/30" dir="ltr">{String(h).padStart(2, "0")}:00</div>
                {days.map((_, i) => <div key={i} className="h-16 border-r border-white/[0.04]" />)}
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
                    className={`absolute rounded-lg border p-1.5 text-[10px] leading-4 ${statusColor[a.status] ?? "border-white/20 bg-white/5"}`}
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
                    <p className="truncate text-white/60">{a.service?.name ?? a.line.name}</p>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
