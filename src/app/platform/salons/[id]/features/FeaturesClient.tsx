"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import type { FeatureMeta, FeatureKey } from "@/lib/entitlements";

type Tri = "default" | "on" | "off";

export function FeaturesClient({
  salonId,
  features,
  planDefaults,
  initialOverrides,
}: {
  salonId: string;
  features: FeatureMeta[];
  planDefaults: Record<FeatureKey, boolean>;
  initialOverrides: Partial<Record<FeatureKey, boolean>>;
}) {
  const [ov, setOv] = useState<Partial<Record<FeatureKey, boolean>>>(initialOverrides);
  const [busy, setBusy] = useState<FeatureKey | null>(null);

  const effective = (k: FeatureKey) => (typeof ov[k] === "boolean" ? ov[k]! : planDefaults[k]);
  const state = (k: FeatureKey): Tri => (typeof ov[k] === "boolean" ? (ov[k] ? "on" : "off") : "default");

  async function apply(k: FeatureKey, next: Tri) {
    const value = next === "default" ? null : next === "on";
    setBusy(k);
    // optimistic
    setOv((o) => {
      const c = { ...o };
      if (value === null) delete c[k];
      else c[k] = value;
      return c;
    });
    try {
      const res = await fetch(`/api/platform/salons/${salonId}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: { [k]: value } }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "خطا");
      toast.success("ذخیره شد");
    } catch (e: any) {
      toast.error(e.message || "خطا در ذخیره");
      setOv(initialOverrides); // rollback to a known-good snapshot
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {features.map((f, i) => {
        const on = effective(f.key);
        const st = state(f.key);
        return (
          <div
            key={f.key}
            className="card animate-fade-up flex flex-col gap-3 p-4"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${on ? "bg-emerald-400" : "bg-white/25"}`} />
                  <h3 className="truncate text-sm font-bold">{f.label}</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/50">{f.desc}</p>
              </div>
              {busy === f.key && <Loader2 size={15} className="shrink-0 animate-spin text-rose-300" />}
            </div>

            <div className="flex items-center gap-1.5 self-start rounded-xl bg-white/[0.04] p-1">
              <Seg active={st === "default"} onClick={() => apply(f.key, "default")}>
                <RotateCcw size={12} /> پیش‌فرض ({planDefaults[f.key] ? "روشن" : "خاموش"})
              </Seg>
              <Seg active={st === "on"} tone="on" onClick={() => apply(f.key, "on")}>
                <Check size={13} /> روشن
              </Seg>
              <Seg active={st === "off"} tone="off" onClick={() => apply(f.key, "off")}>
                <X size={13} /> خاموش
              </Seg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Seg({
  active, tone, onClick, children,
}: {
  active: boolean; tone?: "on" | "off"; onClick: () => void; children: React.ReactNode;
}) {
  const activeCls =
    tone === "on" ? "bg-emerald-500/20 text-emerald-300"
    : tone === "off" ? "bg-red-500/20 text-red-300"
    : "bg-white/12 text-white";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
        active ? activeCls : "text-white/45 hover:text-white/70"
      }`}
    >
      {children}
    </button>
  );
}
