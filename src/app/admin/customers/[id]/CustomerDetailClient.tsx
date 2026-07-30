"use client";

import { useState } from "react";
import { Save, Loader2, MessageCircle, Crown, Palette, AlertTriangle, Sparkles, StickyNote, CalendarClock, History } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatNumber, toJalali } from "@/lib/utils";

type Detail = {
  id: string; name: string; phone: string; notes: string;
  hairFormula: string; allergies: string; skinNotes: string; birthday: string;
  loyaltyPoints: number; loyaltyTier: string;
};
type Hist = { id: string; startAt: string; status: string; amount: number; line: string; service: string; provider: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "در انتظار", cls: "text-amber-300" },
  CONFIRMED: { label: "تأییدشده", cls: "text-sky-300" },
  DONE: { label: "انجام‌شده", cls: "text-mint-300" },
  CANCELLED: { label: "لغوشده", cls: "text-white/40" },
  NO_SHOW: { label: "غیبت", cls: "text-red-300" },
};
const TIERS = ["BRONZE", "SILVER", "GOLD"];
const TIER_LABEL: Record<string, string> = { BRONZE: "برنزی", SILVER: "نقره‌ای", GOLD: "طلایی" };

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "").replace(/^0/, "98");
  return `https://wa.me/${d}`;
}

export function CustomerDetailClient({ initial, history }: { initial: Detail; history: Hist[] }) {
  const [c, setC] = useState<Detail>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Detail>(k: K, v: Detail[K]) => setC((x) => ({ ...x, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${c.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("پرونده ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      {/* Left: record editor */}
      <div className="space-y-5">
        <div className="card-glow relative overflow-hidden p-6">
          <div className="blob -left-8 -bottom-10 h-40 w-40 bg-plum-500/15" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-gradient text-xl font-black text-white">{c.name.charAt(0)}</div>
              <div>
                <h1 className="text-xl font-black">{c.name}</h1>
                <p className="text-sm text-white/45" dir="ltr">{c.phone}</p>
              </div>
            </div>
            <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-xs text-mint-200">
              <MessageCircle size={15} /> واتساپ
            </a>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <div><label className="label">نام</label><input value={c.name} onChange={(e) => set("name", e.target.value)} className="input mt-1.5" /></div>
          <div>
            <label className="label flex items-center gap-1.5"><Palette size={13} className="text-rose-300" /> فرمول رنگ مو</label>
            <textarea value={c.hairFormula} onChange={(e) => set("hairFormula", e.target.value)} className="input mt-1.5 min-h-16" placeholder="مثلاً: 7.1 + 8.0 اکسیدان ۶٪ — ۳۵ دقیقه" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-400" /> حساسیت‌ها</label>
            <textarea value={c.allergies} onChange={(e) => set("allergies", e.target.value)} className="input mt-1.5 min-h-16" placeholder="حساسیت به مواد خاص، آلرژی پوستی…" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Sparkles size={13} className="text-mint-300" /> یادداشت پوست/مو</label>
            <textarea value={c.skinNotes} onChange={(e) => set("skinNotes", e.target.value)} className="input mt-1.5 min-h-16" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5"><StickyNote size={13} /> یادداشت کلی</label>
              <input value={c.notes} onChange={(e) => set("notes", e.target.value)} className="input mt-1.5" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><CalendarClock size={13} /> تاریخ تولد</label>
              <input type="date" value={c.birthday} onChange={(e) => set("birthday", e.target.value)} className="input mt-1.5" dir="ltr" />
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-rose px-5 py-2.5 text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره پرونده
          </button>
        </div>
      </div>

      {/* Right: loyalty + history */}
      <div className="space-y-5">
        <div className="card relative overflow-hidden p-6">
          <div className="blob -right-6 -top-8 h-32 w-32 bg-gold-400/15" />
          <h3 className="relative flex items-center gap-2 font-black"><Crown size={16} className="text-gold-300" /> باشگاه مشتریان</h3>
          <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">امتیاز</label>
              <input type="number" min={0} value={c.loyaltyPoints} onChange={(e) => set("loyaltyPoints", Number(e.target.value))} className="input mt-1.5" dir="ltr" />
            </div>
            <div>
              <label className="label">سطح</label>
              <select value={c.loyaltyTier} onChange={(e) => set("loyaltyTier", e.target.value)} className="input mt-1.5">
                {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <p className="relative mt-3 text-[11px] text-white/40">امتیاز پس از هر پرداخت موفق به‌صورت خودکار اضافه می‌شود؛ اینجا می‌توانی دستی هم اصلاح کنی.</p>
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-black"><History size={16} className="text-plum-300" /> سابقه خدمات ({formatNumber(history.length)})</h3>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">هنوز نوبتی ثبت نشده است.</p>
          ) : (
            <ol className="mt-4 space-y-3 border-r border-white/[0.08] pr-4">
              {history.map((h) => {
                const st = STATUS[h.status] ?? STATUS.PENDING;
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-plum-400" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{h.line}{h.service ? ` • ${h.service}` : ""}</p>
                      <span className={`text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {toJalali(new Date(h.startAt))}{h.provider ? ` • ${h.provider}` : ""}{h.amount ? ` • ${formatPrice(h.amount)}` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
