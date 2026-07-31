"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Loader2, ExternalLink, Instagram } from "lucide-react";
import toast from "react-hot-toast";
import { PhotoField } from "@/components/PhotoField";

type Initial = {
  photoUrl: string; title: string; instagram: string; bio: string;
  slug: string; name: string; lines: string[];
};

export function ProviderProfileClient({ salonSlug, initial }: { salonSlug: string; initial: Initial }) {
  const [form, setForm] = useState({
    photoUrl: initial.photoUrl, title: initial.title, instagram: initial.instagram, bio: initial.bio,
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/provider/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("پروفایل ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card-glow relative max-w-3xl space-y-5 overflow-hidden p-6 animate-fade-up">
      <div className="blob -left-10 -bottom-12 h-44 w-44 bg-rose-500/15" />
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">{initial.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {initial.lines.map((l) => <span key={l} className="badge text-[10px] text-rose-200">{l}</span>)}
            </div>
          </div>
          <Link href={`/s/${salonSlug}/provider/${initial.slug}`} target="_blank" className="btn-ghost px-3 py-2 text-xs">
            <ExternalLink size={14} /> مشاهدهٔ صفحهٔ عمومی
          </Link>
        </div>

        <PhotoField value={form.photoUrl} onChange={(v) => setForm({ ...form, photoUrl: v })} shape="circle" label="عکس پروفایل" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">عنوان تخصص</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input mt-1.5" placeholder="مثلاً متخصص میکاپ عروس" />
          </div>
          <div>
            <label className="label">اینستاگرام</label>
            <div className="relative mt-1.5">
              <Instagram size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-plum-300" />
              <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="input pr-9" dir="ltr" placeholder="@handle" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">رزومه / دربارهٔ من</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="input mt-1.5 min-h-36 leading-7"
            maxLength={2000}
            placeholder="سابقه، مدارک، دوره‌ها و تخصص‌های خود را بنویسید تا مشتری قبل از رزرو نوبت با شما آشنا شود…"
          />
          <p className="mt-1 text-left text-[11px] text-white/35">{form.bio.length}/2000</p>
        </div>

        <button disabled={saving} className="btn-rose px-5 py-2.5 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره پروفایل
        </button>
      </div>
    </form>
  );
}
