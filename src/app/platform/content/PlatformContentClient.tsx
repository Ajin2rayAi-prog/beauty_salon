"use client";

import { useState } from "react";
import { Save, Loader2, Plus, Trash2, Sparkles, BarChart3, LayoutGrid, MessageSquareQuote, Phone } from "lucide-react";
import toast from "react-hot-toast";
import type { PlatformContent, PlatformStat, PlatformFeature, PlatformStep, Testimonial } from "@/lib/content";

const TABS = [
  { id: "hero", label: "هیرو و برند", icon: Sparkles },
  { id: "stats", label: "آمار", icon: BarChart3 },
  { id: "features", label: "ویژگی‌ها و مراحل", icon: LayoutGrid },
  { id: "testimonials", label: "نظرات", icon: MessageSquareQuote },
  { id: "contact", label: "تماس و فوتر", icon: Phone },
] as const;

const FEATURE_ICONS = ["CalendarHeart", "Wallet", "Users", "Bell", "Sparkles", "Scissors"];

export function PlatformContentClient({ initial }: { initial: PlatformContent }) {
  const [c, setC] = useState<PlatformContent>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("hero");
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<PlatformContent>) => setC((x) => ({ ...x, ...p }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/platform/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("محتوا ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="card flex flex-wrap gap-2 p-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${tab === t.id ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="card-glow relative overflow-hidden p-6">
        <div className="blob -left-10 -bottom-12 h-44 w-44 bg-rose-500/15" />
        <div className="relative space-y-4">
          {tab === "hero" && <HeroTab c={c} patch={patch} />}
          {tab === "stats" && <StatsTab c={c} patch={patch} />}
          {tab === "features" && <FeaturesTab c={c} patch={patch} />}
          {tab === "testimonials" && <TestimonialsTab c={c} patch={patch} />}
          {tab === "contact" && <ContactTab c={c} patch={patch} />}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-rose px-6 py-3 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره محتوا
      </button>
    </div>
  );
}

type P = { c: PlatformContent; patch: (p: Partial<PlatformContent>) => void };

function TextField({ label, value, onChange, ltr }: { label: string; value: string; onChange: (v: string) => void; ltr?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5" dir={ltr ? "ltr" : undefined} />
    </div>
  );
}

function HeroTab({ c, patch }: P) {
  const h = c.hero;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="نام برند" value={c.brandName} onChange={(v) => patch({ brandName: v })} />
      <TextField label="عنوان کوچک" value={h.eyebrow} onChange={(v) => patch({ hero: { ...h, eyebrow: v } })} />
      <TextField label="عنوان اصلی" value={h.title} onChange={(v) => patch({ hero: { ...h, title: v } })} />
      <TextField label="کلمه‌ی برجسته" value={h.highlight} onChange={(v) => patch({ hero: { ...h, highlight: v } })} />
      <div className="sm:col-span-2">
        <label className="label">زیرعنوان</label>
        <textarea value={h.subtitle} onChange={(e) => patch({ hero: { ...h, subtitle: e.target.value } })} className="input mt-1.5 min-h-20" />
      </div>
      <TextField label="دکمه اصلی" value={h.ctaPrimary} onChange={(v) => patch({ hero: { ...h, ctaPrimary: v } })} />
      <TextField label="دکمه دوم" value={h.ctaSecondary} onChange={(v) => patch({ hero: { ...h, ctaSecondary: v } })} />
    </div>
  );
}

function ContactTab({ c, patch }: P) {
  const k = c.contact;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="تلفن" value={k.phone} onChange={(v) => patch({ contact: { ...k, phone: v } })} ltr />
      <TextField label="ایمیل" value={k.email} onChange={(v) => patch({ contact: { ...k, email: v } })} ltr />
      <TextField label="آدرس" value={k.address} onChange={(v) => patch({ contact: { ...k, address: v } })} />
      <TextField label="اینستاگرام" value={k.instagram} onChange={(v) => patch({ contact: { ...k, instagram: v } })} ltr />
      <div className="sm:col-span-2">
        <TextField label="متن فوتر" value={c.footerNote} onChange={(v) => patch({ footerNote: v })} />
      </div>
    </div>
  );
}

function StatsTab({ c, patch }: P) {
  function setS(i: number, p: Partial<PlatformStat>) {
    patch({ stats: c.stats.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">آمار ({c.stats.length})</label>
        <button type="button" onClick={() => patch({ stats: [...c.stats, { label: "", value: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
      </div>
      {c.stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={s.value} onChange={(e) => setS(i, { value: e.target.value })} className="input !w-28" placeholder="عدد" />
          <input value={s.label} onChange={(e) => setS(i, { label: e.target.value })} className="input flex-1" placeholder="عنوان" />
          <button type="button" onClick={() => patch({ stats: c.stats.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );
}

function FeaturesTab({ c, patch }: P) {
  function setF(i: number, p: Partial<PlatformFeature>) {
    patch({ features: c.features.map((f, idx) => (idx === i ? { ...f, ...p } : f)) });
  }
  function setStep(i: number, p: Partial<PlatformStep>) {
    patch({ steps: c.steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)) });
  }
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label">ویژگی‌ها ({c.features.length})</label>
          <button type="button" onClick={() => patch({ features: [...c.features, { icon: "Sparkles", title: "", text: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
        </div>
        <div className="space-y-3">
          {c.features.map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] p-3.5">
              <div className="flex items-center gap-2">
                <select value={f.icon} onChange={(e) => setF(i, { icon: e.target.value })} className="input !w-36 text-xs" dir="ltr">
                  {FEATURE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={f.title} onChange={(e) => setF(i, { title: e.target.value })} className="input flex-1" placeholder="عنوان" />
                <button type="button" onClick={() => patch({ features: c.features.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
              </div>
              <input value={f.text} onChange={(e) => setF(i, { text: e.target.value })} className="input mt-2" placeholder="توضیح" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label">مراحل کار ({c.steps.length})</label>
          <button type="button" onClick={() => patch({ steps: [...c.steps, { title: "", text: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
        </div>
        <div className="space-y-3">
          {c.steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] p-3.5">
              <div className="flex items-center gap-2">
                <input value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} className="input flex-1" placeholder={`مرحله ${i + 1}`} />
                <button type="button" onClick={() => patch({ steps: c.steps.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
              </div>
              <input value={s.text} onChange={(e) => setStep(i, { text: e.target.value })} className="input mt-2" placeholder="توضیح" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsTab({ c, patch }: P) {
  function setT(i: number, p: Partial<Testimonial>) {
    patch({ testimonials: c.testimonials.map((t, idx) => (idx === i ? { ...t, ...p } : t)) });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">نظرات ({c.testimonials.length})</label>
        <button type="button" onClick={() => patch({ testimonials: [...c.testimonials, { name: "", role: "", text: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
      </div>
      {c.testimonials.map((t, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.08] p-3.5">
          <div className="flex items-center gap-2">
            <input value={t.name} onChange={(e) => setT(i, { name: e.target.value })} className="input flex-1" placeholder="نام" />
            <input value={t.role} onChange={(e) => setT(i, { role: e.target.value })} className="input !w-40" placeholder="سمت" />
            <button type="button" onClick={() => patch({ testimonials: c.testimonials.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
          </div>
          <textarea value={t.text} onChange={(e) => setT(i, { text: e.target.value })} className="input mt-2 min-h-16" placeholder="متن نظر" />
        </div>
      ))}
    </div>
  );
}
