"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/utils";
import { Save, Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";

type Sched = { id: string; dayOfWeek: number; startTime: string; endTime: string; isOff: boolean };
type Row = { dayOfWeek: number; startTime: string; endTime: string; isOff: boolean };

export function ScheduleClient({ providerId, initialSchedules }: { providerId: string; initialSchedules: Sched[] }) {
  // normalize to 7 rows (Sat=0..Fri=6)
  const [rows, setRows] = useState<Row[]>(() => {
    const byDay = new Map(initialSchedules.map((s) => [s.dayOfWeek, s]));
    return Array.from({ length: 7 }, (_, i) => {
      const s = byDay.get(i);
      return { dayOfWeek: i, startTime: s?.startTime ?? "10:00", endTime: s?.endTime ?? "20:00", isOff: s?.isOff ?? false };
    });
  });
  const [saving, setSaving] = useState(false);

  function setRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((x, xi) => (xi === i ? { ...x, ...patch } : x)));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/provider/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, schedules: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("ساعات کاری ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card max-w-3xl p-6">
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.dayOfWeek} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 transition ${r.isOff ? "border-white/[0.04] bg-white/[0.01] opacity-60" : "border-white/[0.07] bg-white/[0.02]"}`}>
            <div className="flex w-28 items-center gap-2">
              <input
                type="checkbox" id={`off-${i}`} checked={!r.isOff}
                onChange={(e) => setRow(i, { isOff: !e.target.checked })}
                className="h-4 w-4 accent-rose-500"
              />
              <label htmlFor={`off-${i}`} className="cursor-pointer text-sm font-semibold">{DAY_LABELS[r.dayOfWeek]}</label>
            </div>
            {!r.isOff ? (
              <div className="flex items-center gap-2" dir="ltr">
                <input type="time" value={r.startTime} onChange={(e) => setRow(i, { startTime: e.target.value })} className="input w-28 py-1.5 text-sm" />
                <span className="text-white/40">تا</span>
                <input type="time" value={r.endTime} onChange={(e) => setRow(i, { endTime: e.target.value })} className="input w-28 py-1.5 text-sm" />
              </div>
            ) : (
              <span className="text-xs text-white/35">روز تعطیل</span>
            )}
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-rose mt-6 px-5 py-2.5 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره ساعات کاری
      </button>
    </div>
  );
}
