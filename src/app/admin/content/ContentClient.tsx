"use client";

import { useState } from "react";
import { Save, Loader2, Plus, Trash2, Sparkles, Info, MessageSquareQuote, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import type { SalonContent, SalonHighlight, Testimonial } from "@/lib/content";

const TABS = [
  { id: "hero", label: "معرفی و هیرو", icon: Sparkles },
  { id: "about", label: "درباره و ویژگی‌ها", icon: Info },
  { id: "testimonials", label: "نظرات مشتریان", icon: MessageSquareQuote },
  { id: "social", label: "شبکه‌های اجتماعی", icon: Share2 },
] as const;

export function ContentClient({ initial }: { initial: SalonContent }) {
  const [c, setC] = useState<SalonContent>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("hero");
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<SalonContent>) { setC((x) => ({ ...x, ...p })); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
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
        <div className="blob -left-10 -bottom-12 h-44 w-44 bg-plum-500/15" />
        <div className="relative space-y-5">
          {tab === "hero" && <HeroTab c={c} patch={patch} />}
          {tab === "about" && <AboutTab c={c} patch={patch} />}
          {tab === "testimonials" && <TestimonialsTab c={c} patch={patch} />}
          {tab === "social" && <SocialTab c={c} patch={patch} />}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-rose px-6 py-3 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره محتوا
      </button>
    </div>
  );
}

type TabProps = { c: SalonContent; patch: (p: Partial<SalonContent>) => void };

function Field({ label, value, onChange, ltr, placeholder }: { label: string; value: string; onChange: (v: string) => void; ltr?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5" dir={ltr ? "ltr" : undefined} placeholder={placeholder} />
    </div>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5 min-h-24" />
    </div>
  );
}

function HeroTab({ c, patch }: TabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="عنوان کوچک (بالای صفحه)" value={c.hero.eyebrow} onChange={(v) => patch({ hero: { ...c.hero, eyebrow: v } })} />
      <Field label="شعار اصلی" value={c.hero.tagline} onChange={(v) => patch({ hero: { ...c.hero, tagline: v } })} />
      <div className="sm:col-span-2">
        <Field label="عنوان بخش گالری" value={c.galleryTitle} onChange={(v) => patch({ galleryTitle: v })} />
      </div>
    </div>
  );
}

function SocialTab({ c, patch }: TabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="اینستاگرام" value={c.social.instagram} onChange={(v) => patch({ social: { ...c.social, instagram: v } })} ltr placeholder="@salon" />
      <Field label="تلگرام" value={c.social.telegram} onChange={(v) => patch({ social: { ...c.social, telegram: v } })} ltr placeholder="@salon" />
      <Field label="واتساپ" value={c.social.whatsapp} onChange={(v) => patch({ social: { ...c.social, whatsapp: v } })} ltr placeholder="09..." />
    </div>
  );
}

const HIGHLIGHT_ICONS = ["Sparkles", "Clock", "Heart", "Star", "Shield", "Award"];

function AboutTab({ c, patch }: TabProps) {
  function setHl(i: number, p: Partial<SalonHighlight>) {
    const highlights = c.highlights.map((h, idx) => (idx === i ? { ...h, ...p } : h));
    patch({ highlights });
  }
  return (
    <div className="space-y-5">
      <Field label="عنوان بخش درباره" value={c.about.title} onChange={(v) => patch({ about: { ...c.about, title: v } })} />
      <Area label="متن درباره" value={c.about.body} onChange={(v) => patch({ about: { ...c.about, body: v } })} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="label">ویژگی‌ها ({c.highlights.length})</label>
          <button type="button" onClick={() => patch({ highlights: [...c.highlights, { icon: "Sparkles", title: "", text: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
        </div>
        <div className="space-y-3">
          {c.highlights.map((h, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] p-3.5">
              <div className="flex items-center gap-2">
                <select value={h.icon} onChange={(e) => setHl(i, { icon: e.target.value })} className="input !w-32 text-xs" dir="ltr">
                  {HIGHLIGHT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={h.title} onChange={(e) => setHl(i, { title: e.target.value })} className="input flex-1" placeholder="عنوان" />
                <button type="button" onClick={() => patch({ highlights: c.highlights.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
              </div>
              <input value={h.text} onChange={(e) => setHl(i, { text: e.target.value })} className="input mt-2" placeholder="توضیح کوتاه" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsTab({ c, patch }: TabProps) {
  function setT(i: number, p: Partial<Testimonial>) {
    patch({ testimonials: c.testimonials.map((t, idx) => (idx === i ? { ...t, ...p } : t)) });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">نظرات مشتریان ({c.testimonials.length})</label>
        <button type="button" onClick={() => patch({ testimonials: [...c.testimonials, { name: "", role: "مشتری", text: "" }] })} className="btn-ghost px-3 py-1.5 text-xs"><Plus size={13} /> افزودن</button>
      </div>
      {c.testimonials.map((t, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.08] p-3.5">
          <div className="flex items-center gap-2">
            <input value={t.name} onChange={(e) => setT(i, { name: e.target.value })} className="input flex-1" placeholder="نام" />
            <input value={t.role} onChange={(e) => setT(i, { role: e.target.value })} className="input !w-32" placeholder="عنوان" />
            <button type="button" onClick={() => patch({ testimonials: c.testimonials.filter((_, idx) => idx !== i) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
          </div>
          <textarea value={t.text} onChange={(e) => setT(i, { text: e.target.value })} className="input mt-2 min-h-16" placeholder="متن نظر" />
        </div>
      ))}
    </div>
  );
}
