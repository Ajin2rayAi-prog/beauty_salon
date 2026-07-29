"use client";

import { useState } from "react";
import { formatPrice, pricingModeLabel, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { Scissors, Plus, Save, Loader2, X, ChevronDown, ChevronUp, Percent, Home } from "lucide-react";
import toast from "react-hot-toast";

type Service = { id: string; name: string; durationMin: number; price: number; active: boolean };
type Line = {
  id: string; name: string; slug: string; icon: string | null; description: string | null;
  pricingMode: string; rentAmount: number; commissionPercent: number; active: boolean; order: number;
  services: Service[];
  _count: { services: number; providers: number; appointments: number };
};

const lineIcons: Record<string, string> = {
  Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
};

export function LinesClient({ initialLines }: { initialLines: Line[] }) {
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // local editable copies keyed by line id
  const [edits, setEdits] = useState<Record<string, { pricingMode: string; rentAmount: number; commissionPercent: number }>>({});

  function editOf(l: Line) {
    return edits[l.id] ?? { pricingMode: l.pricingMode, rentAmount: l.rentAmount, commissionPercent: l.commissionPercent };
  }
  function setEdit(id: string, patch: Partial<{ pricingMode: string; rentAmount: number; commissionPercent: number }>) {
    setEdits((e) => {
      const base = e[id] ?? { pricingMode: "PERCENTAGE", rentAmount: 0, commissionPercent: 30 };
      return { ...e, [id]: { ...base, ...patch } };
    });
  }

  async function saveLine(line: Line) {
    const e = editOf(line);
    setSaving(line.id);
    try {
      const res = await fetch(`/api/admin/lines/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingMode: e.pricingMode,
          rentAmount: Number(e.rentAmount) || 0,
          commissionPercent: Number(e.commissionPercent) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره");
      toast.success(`«${line.name}» ذخیره شد`);
      setLines((ls) => ls.map((x) => (x.id === line.id ? { ...x, ...data.line } : x)));
      setEdits((ed) => { const n = { ...ed }; delete n[line.id]; return n; });
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const e = editOf(line);
        const dirty = !!edits[line.id];
        const open = !!expanded[line.id];
        return (
          <div
            key={line.id}
            className="card overflow-hidden animate-fade-up transition hover:border-rose-400/25"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {/* header row */}
            <button
              onClick={() => setExpanded((x) => ({ ...x, [line.id]: !open }))}
              className="flex w-full flex-wrap items-center gap-4 p-5 text-right"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-gradient text-xl shadow-lg">
                {lineIcons[line.icon ?? ""] ?? "💫"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{line.name}</h3>
                  <Badge className={line.active ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"}>{line.active ? "فعال" : "غیرفعال"}</Badge>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {formatNumber(line._count.services)} خدمت • {formatNumber(line._count.providers)} خدمت‌دهنده • {formatNumber(line._count.appointments)} نوبت
                </p>
              </div>
              <span className="badge text-xs">{pricingModeLabel(line.pricingMode)}</span>
              {open ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
            </button>

            {/* expanded editor */}
            {open && (
              <div className="border-t border-white/[0.06] p-5">
                {/* pricing mode editor */}
                <div className="grid gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">حالت قیمت‌گذاری</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEdit(line.id, { pricingMode: "PERCENTAGE" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                          e.pricingMode === "PERCENTAGE"
                            ? "border-rose-400/50 bg-rose-400/10 text-rose-300"
                            : "border-white/[0.08] text-white/60 hover:border-white/20"
                        }`}
                      >
                        <Percent size={16} /> درصدی
                      </button>
                      <button
                        onClick={() => setEdit(line.id, { pricingMode: "RENT" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                          e.pricingMode === "RENT"
                            ? "border-plum-400/50 bg-plum-400/10 text-plum-300"
                            : "border-white/[0.08] text-white/60 hover:border-white/20"
                        }`}
                      >
                        <Home size={16} /> اجاره ثابت
                      </button>
                    </div>
                  </div>

                  {e.pricingMode === "PERCENTAGE" ? (
                    <div className="sm:col-span-2">
                      <label className="label">درصد سهم سالن (%)</label>
                      <input
                        type="number" min={0} max={100} value={e.commissionPercent}
                        onChange={(ev) => setEdit(line.id, { commissionPercent: Number(ev.target.value) })}
                        className="input mt-1.5 w-40"
                      />
                      <p className="mt-1.5 text-[11px] text-white/40">
                        از هر خدمت، {formatNumber(e.commissionPercent)}٪ به سالن و مابقی به خدمت‌دهنده می‌رسد.
                      </p>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="label">اجاره ماهانه (تومان)</label>
                      <input
                        type="number" min={0} value={e.rentAmount}
                        onChange={(ev) => setEdit(line.id, { rentAmount: Number(ev.target.value) })}
                        className="input mt-1.5 w-56"
                      />
                      <p className="mt-1.5 text-[11px] text-white/40">
                        خدمت‌دهنده این مبلغ را ماهانه پرداخت می‌کند و کل درآمد خدمت مال خودش است.
                      </p>
                    </div>
                  )}

                  {dirty && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <button onClick={() => saveLine(line)} disabled={saving === line.id} className="btn-rose px-4 py-2 text-sm">
                        {saving === line.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره
                      </button>
                      <button onClick={() => setEdits((ed) => { const n = { ...ed }; delete n[line.id]; return n; })} className="btn-ghost px-3 py-2 text-sm">
                        <X size={15} /> انصراف
                      </button>
                    </div>
                  )}
                </div>

                {/* services list */}
                <h4 className="mb-3 mt-5 flex items-center gap-2 text-sm font-bold"><Scissors size={15} className="text-rose-300" /> خدمات این لاین</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {line.services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="text-white/80">{s.name}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-white/40">{formatNumber(s.durationMin)} دقیقه</span>
                        <span className="font-semibold text-rose-300">{formatPrice(s.price)}</span>
                      </span>
                    </div>
                  ))}
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] px-3 py-2 text-sm text-white/50 transition hover:border-rose-400/40 hover:text-rose-300">
                    <Plus size={15} /> افزودن خدمت
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {lines.length === 0 && (
        <div className="card p-12 text-center text-white/45">
          <Scissors size={32} className="mx-auto text-white/25" />
          <p className="mt-3">هنوز لاینی ساخته نشده است.</p>
        </div>
      )}
    </div>
  );
}
