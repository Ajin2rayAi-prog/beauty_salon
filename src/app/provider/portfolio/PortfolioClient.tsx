"use client";

import { useState } from "react";
import { Camera, Plus, Loader2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

type LineOpt = { id: string; name: string };
type Item = { id: string; imageUrl: string; caption: string | null; lineId: string | null; line: { id: string; name: string } | null };

export function PortfolioClient({ providerId, lines, initialItems }: { providerId: string; lines: LineOpt[]; initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ imageUrl: "", caption: "", lineId: lines[0]?.id ?? "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) { toast.error("لینک تصویر الزامی است"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/provider/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, ...form, lineId: form.lineId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setItems((it) => [data.item, ...it]);
      setForm({ imageUrl: "", caption: "", lineId: lines[0]?.id ?? "" });
      setShowForm(false);
      toast.success("نمونه‌کار اضافه شد");
    } catch (err: any) {
      toast.error(err.message || "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/provider/portfolio?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا");
      setItems((it) => it.filter((x) => x.id !== id));
      toast.success("حذف شد");
    } catch {
      toast.error("خطا در حذف");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => setShowForm((s) => !s)} className="btn-rose px-4 py-2.5 text-sm">
        <Plus size={16} /> افزودن نمونه‌کار
      </button>

      {showForm && (
        <form onSubmit={add} className="card animate-fade-up space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label">لینک تصویر</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input mt-1.5" dir="ltr" placeholder="https://..." /></div>
            <div><label className="label">لاین</label>
              <select value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} className="input mt-1.5">
                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">توضیح (اختیاری)</label><input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="input mt-1.5" /></div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} افزودن</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-3 py-2 text-sm"><X size={15} /> انصراف</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="card p-12 text-center text-white/45">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-coral-500/10 text-coral-300"><Camera size={30} /></div>
          <p className="mt-4">هنوز نمونه‌کاری اضافه نکرده‌اید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <figure key={it.id} className="group relative animate-fade-up overflow-hidden rounded-2xl border border-white/[0.06] shadow-lg" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.imageUrl} alt={it.caption ?? ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              {/* gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              {/* caption overlay on hover */}
              <figcaption className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-1 p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {it.line && <span className="badge w-fit text-[10px] text-rose-100">{it.line.name}</span>}
                {it.caption && <span className="truncate text-[11px] text-white/85">{it.caption}</span>}
              </figcaption>
              {/* delete button */}
              <button
                onClick={() => remove(it.id)}
                disabled={deleting === it.id}
                className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-red-300 opacity-0 backdrop-blur transition hover:bg-red-500/40 hover:text-white group-hover:opacity-100"
                title="حذف"
              >
                {deleting === it.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
