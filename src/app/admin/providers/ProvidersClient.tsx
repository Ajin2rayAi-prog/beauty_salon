"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Users, Plus, Loader2, X, Instagram, ToggleLeft, ToggleRight, Scissors } from "lucide-react";
import toast from "react-hot-toast";

type LineOpt = { id: string; name: string };
type Provider = {
  id: string; slug: string; title: string | null; bio: string | null; photoUrl: string | null;
  instagram: string | null; active: boolean;
  user: { name: string; email: string; phone: string | null };
  lines: { lineId: string; line: { id: string; name: string } }[];
  _count: { appointments: number; portfolios: number };
};

export function ProvidersClient({ initialProviders, lines }: { initialProviders: Provider[]; lines: LineOpt[] }) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "Kia@123", title: "", slug: "", lineIds: [] as string[] });

  function toggleLine(id: string) {
    setForm((f) => ({ ...f, lineIds: f.lineIds.includes(id) ? f.lineIds.filter((x) => x !== id) : [...f.lineIds, id] }));
  }

  async function createProvider(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ساخت");
      toast.success("خدمت‌دهنده ساخته شد");
      setProviders((p) => [...p, data.provider]);
      setForm({ name: "", email: "", phone: "", password: "Kia@123", title: "", slug: "", lineIds: [] });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "خطا در ساخت");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(p: Provider) {
    setToggling(p.id);
    try {
      const res = await fetch(`/api/admin/providers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setProviders((ps) => ps.map((x) => (x.id === p.id ? { ...x, active: data.provider.active } : x)));
      toast.success(data.provider.active ? "فعال شد" : "غیرفعال شد");
    } catch (err: any) {
      toast.error(err.message || "خطا");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => setShowForm((s) => !s)} className="btn-rose px-4 py-2.5 text-sm">
        <Plus size={16} /> افزودن خدمت‌دهنده
      </button>

      {showForm && (
        <form onSubmit={createProvider} className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">نام کامل</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1.5" /></div>
            <div><label className="label">ایمیل</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
            <div><label className="label">موبایل</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
            <div><label className="label">عنوان (مثلاً متخصص میکاپ)</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input mt-1.5" /></div>
            <div><label className="label">اسلاگ پروفایل (انگلیسی)</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input mt-1.5" dir="ltr" placeholder="sara" /></div>
            <div><label className="label">رمز اولیه</label><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input mt-1.5" dir="ltr" /></div>
          </div>
          <div>
            <label className="label">لاین‌ها</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {lines.map((l) => (
                <button type="button" key={l.id} onClick={() => toggleLine(l.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${form.lineIds.includes(l.id) ? "border-rose-400/50 bg-rose-400/10 text-rose-300" : "border-white/[0.08] text-white/60"}`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} ساخت</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-3 py-2 text-sm"><X size={15} /> انصراف</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <div key={p.id} className="card flex flex-col p-5">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-rose-400/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl ?? `https://picsum.photos/seed/${p.slug}/120/120`} alt={p.title ?? p.slug} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-bold">{p.title ?? "خدمت‌دهنده"}</h3>
                  <Badge className={p.active ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"}>{p.active ? "فعال" : "غیرفعال"}</Badge>
                </div>
                <p className="truncate text-xs text-white/45">{p.user.name}</p>
                {p.instagram && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-plum-300"><Instagram size={11} /> {p.instagram}</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.lines.map((pl) => (
                <span key={pl.lineId} className="badge text-[10px]"><Scissors size={10} className="ml-1" /> {pl.line.name}</span>
              ))}
              {p.lines.length === 0 && <span className="text-xs text-white/35">لاینی نسبت داده نشده</span>}
            </div>
            <p className="mt-3 text-xs text-white/40">{p._count.appointments} نوبت • {p._count.portfolios} نمونه‌کار</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <button onClick={() => toggleActive(p)} disabled={toggling === p.id} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-rose-300">
                {toggling === p.id ? <Loader2 size={15} className="animate-spin" /> : p.active ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                {p.active ? "غیرفعال کردن" : "فعال کردن"}
              </button>
              <span className="text-[11px] text-white/30">/{p.slug}</span>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="card p-12 text-center text-white/45">
          <Users size={32} className="mx-auto text-white/25" />
          <p className="mt-3">هنوز خدمت‌دهنده‌ای ثبت نشده است.</p>
        </div>
      )}
    </div>
  );
}
