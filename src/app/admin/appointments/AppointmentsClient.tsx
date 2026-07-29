"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime } from "@/lib/utils";
import { CalendarClock, Check, X, CheckCheck, Banknote, Loader2, Filter } from "lucide-react";
import toast from "react-hot-toast";

type Appt = {
  id: string; status: string; payStatus: string; payMethod: string; amount: number; deposit: number;
  startAt: string; notes: string | null;
  customer: { name: string; phone: string };
  provider: { title: string | null };
  line: { id: string; name: string };
  service: { name: string } | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "PENDING", label: "در انتظار" },
  { value: "CONFIRMED", label: "تأیید شده" },
  { value: "DONE", label: "انجام شد" },
  { value: "CANCELLED", label: "لغو شده" },
  { value: "NO_SHOW", label: "غیبت" },
];

export function AppointmentsClient({
  initialAppointments, lines, providers,
}: {
  initialAppointments: Appt[];
  lines: { id: string; name: string }[];
  providers: { id: string; title: string | null }[];
}) {
  const router = useRouter();
  const [appts, setAppts] = useState<Appt[]>(initialAppointments);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState({ status: "", lineId: "", providerId: "" });

  async function act(id: string, action: string, extra?: object) {
    setActing(id + action);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setAppts((a) => a.map((x) => (x.id === id ? { ...x, ...data.appointment } : x)));
      toast.success(data.message || "انجام شد");
    } catch (err: any) {
      toast.error(err.message || "خطا");
    } finally {
      setActing(null);
    }
  }

  function applyFilters() {
    const q = new URLSearchParams();
    if (filter.status) q.set("status", filter.status);
    if (filter.lineId) q.set("lineId", filter.lineId);
    if (filter.providerId) q.set("providerId", filter.providerId);
    router.push(`/admin/appointments?${q.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex items-center gap-2 text-sm text-white/50"><Filter size={16} /> فیلتر</div>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="input w-auto py-2 text-sm">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filter.lineId} onChange={(e) => setFilter({ ...filter, lineId: e.target.value })} className="input w-auto py-2 text-sm">
          <option value="">همه لاین‌ها</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filter.providerId} onChange={(e) => setFilter({ ...filter, providerId: e.target.value })} className="input w-auto py-2 text-sm">
          <option value="">همه خدمت‌دهنده‌ها</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={applyFilters} className="btn-outline px-4 py-2 text-sm">اعمال</button>
      </div>

      {/* table */}
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-right text-xs text-white/40">
              <th className="p-3 font-medium">مشتری</th>
              <th className="p-3 font-medium">خدمت / لاین</th>
              <th className="p-3 font-medium">خدمت‌دهنده</th>
              <th className="p-3 font-medium">زمان</th>
              <th className="p-3 font-medium">مبلغ</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">پرداخت</th>
              <th className="p-3 font-medium">اقدام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {appts.map((a) => (
              <tr key={a.id} className="text-white/80">
                <td className="p-3">
                  <div className="font-medium">{a.customer.name}</div>
                  <div className="text-[11px] text-white/40" dir="ltr">{a.customer.phone}</div>
                </td>
                <td className="p-3 text-white/60">{a.service?.name ?? "—"}<div className="text-[11px] text-white/35">{a.line.name}</div></td>
                <td className="p-3 text-white/60">{a.provider.title}</td>
                <td className="p-3 text-white/60">{formatShortDate(a.startAt)}<div className="text-[11px] text-white/35">{formatTime(a.startAt)}</div></td>
                <td className="p-3 font-semibold text-rose-300">{formatPrice(a.amount)}</td>
                <td className="p-3"><StatusBadge status={a.status} /></td>
                <td className="p-3"><StatusBadge status={a.payStatus} /></td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {a.status === "PENDING" && (
                      <ActionBtn icon={<Check size={14} />} label="تأیید" busy={acting === a.id + "confirm"} onClick={() => act(a.id, "confirm")} tone="emerald" />
                    )}
                    {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                      <>
                        <ActionBtn icon={<CheckCheck size={14} />} label="انجام" busy={acting === a.id + "done"} onClick={() => act(a.id, "done")} tone="sky" />
                        <ActionBtn icon={<X size={14} />} label="لغو" busy={acting === a.id + "cancel"} onClick={() => act(a.id, "cancel")} tone="red" />
                      </>
                    )}
                    {a.payStatus !== "PAID" && a.status !== "CANCELLED" && (
                      <ActionBtn icon={<Banknote size={14} />} label="پرداخت" busy={acting === a.id + "pay"} onClick={() => act(a.id, "pay")} tone="amber" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appts.length === 0 && (
          <div className="p-12 text-center text-white/45">
            <CalendarClock size={32} className="mx-auto text-white/25" />
            <p className="mt-3">نوبتی با این فیلتر پیدا نشد.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, busy, onClick, tone }: { icon: React.ReactNode; label: string; busy: boolean; onClick: () => void; tone: "emerald" | "red" | "sky" | "amber" }) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10",
    red: "border-red-400/30 text-red-400 hover:bg-red-400/10",
    sky: "border-sky-400/30 text-sky-400 hover:bg-sky-400/10",
    amber: "border-amber-400/30 text-amber-400 hover:bg-amber-400/10",
  };
  return (
    <button onClick={onClick} disabled={busy} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition ${tones[tone]}`}>
      {busy ? <Loader2 size={13} className="animate-spin" /> : icon} {label}
    </button>
  );
}
