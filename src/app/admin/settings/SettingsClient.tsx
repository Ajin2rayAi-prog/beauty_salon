"use client";

import { useState } from "react";
import { Save, Loader2, Settings as SettingsIcon, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import { PhotoField } from "@/components/PhotoField";

type Salon = {
  id: string; name: string; description: string | null; address: string | null;
  phone: string | null; city: string | null; openTime: string; closeTime: string;
  logoUrl: string | null; coverUrl: string | null; active: boolean;
};

export function SettingsClient({ salon, admin }: { salon: Salon; admin: { name: string; avatar: string } }) {
  const [form, setForm] = useState({
    name: salon.name, description: salon.description ?? "", address: salon.address ?? "",
    phone: salon.phone ?? "", city: salon.city ?? "", openTime: salon.openTime, closeTime: salon.closeTime,
    logoUrl: salon.logoUrl ?? "", coverUrl: salon.coverUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Manager's own photo (shown in the site hero slideshow).
  const [avatar, setAvatar] = useState(admin.avatar ?? "");
  const [savingAvatar, setSavingAvatar] = useState(false);

  async function saveAvatar() {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("عکس مدیر ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره عکس");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/salon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("تنظیمات ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-glow relative max-w-3xl overflow-hidden p-6 animate-fade-up">
        <div className="blob -right-10 -top-12 h-44 w-44 bg-rose-500/15" />
        <div className="relative">
          <span className="eyebrow"><UserCircle size={14} /> عکس مدیر</span>
          <p className="mt-2 mb-4 text-sm text-white/55">این عکس در اسلایدشوی صفحهٔ اصلی سایت شما (به‌عنوان «مدیریت سالن») نمایش داده می‌شود.</p>
          <PhotoField value={avatar} onChange={setAvatar} shape="circle" />
          <button onClick={saveAvatar} disabled={savingAvatar} className="btn-rose mt-4 px-5 py-2.5 text-sm">
            {savingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره عکس مدیر
          </button>
        </div>
      </div>

      <form onSubmit={save} className="card-glow relative max-w-3xl space-y-5 overflow-hidden p-6 animate-fade-up">
      <div className="blob -left-10 -bottom-12 h-44 w-44 bg-plum-500/15" />
      <div className="relative grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">نام سالن</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1.5" /></div>
        <div className="sm:col-span-2"><label className="label">توضیح</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1.5 min-h-24" /></div>
        <div className="sm:col-span-2"><label className="label">آدرس</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input mt-1.5" /></div>
        <div><label className="label">شهر</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input mt-1.5" /></div>
        <div><label className="label">تلفن</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
        <div><label className="label">ساعت شروع</label><input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
        <div><label className="label">ساعت پایان</label><input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
        <div><label className="label">لوگو (URL)</label><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="input mt-1.5" dir="ltr" placeholder="https://..." /></div>
        <div><label className="label">کاور (URL)</label><input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} className="input mt-1.5" dir="ltr" placeholder="https://..." /></div>
      </div>
      <button disabled={saving} className="btn-rose relative px-5 py-2.5 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره تنظیمات
      </button>
    </form>
    </div>
  );
}
