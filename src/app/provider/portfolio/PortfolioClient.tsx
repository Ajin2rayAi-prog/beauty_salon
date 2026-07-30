"use client";

import { useState } from "react";
import { Camera, Plus, Loader2, Trash2, X, Check, Link2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { GALLERY } from "@/lib/images";

type LineOpt = { id: string; name: string };
type Item = { id: string; imageUrl: string; caption: string | null; lineId: string | null; line: { id: string; name: string } | null };

export function PortfolioClient({ providerId, lines, initialItems }: { providerId: string; lines: LineOpt[]; initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ imageUrl: "", caption: "", lineId: lines[0]?.id ?? "" });
  const [mode, setMode] = useState<"gallery" | "url">("gallery");
  const [galleryCat, setGalleryCat] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(GALLERY.map((g) => g.category)))];
  const galleryItems = galleryCat === "all" ? GALLERY : GALLERY.filter((g) => g.category === galleryCat);

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
          {/* source toggle: pick from gallery OR paste a custom URL */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("gallery")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${mode === "gallery" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
              <ImageIcon size={14} /> از گالری
            </button>
            <button type="button" onClick={() => setMode("url")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${mode === "url" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
              <Link2 size={14} /> لینک دلخواه
            </button>
          </div>

          {mode === "gallery" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setGalleryCat(cat)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${galleryCat === cat ? "bg-rose-500/25 text-rose-100" : "bg-white/[0.04] text-white/50 hover:text-white/75"}`}>
                    {cat === "all" ? "همه" : cat}
                  </button>
                ))}
              </div>
              <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-white/[0.06] p-2 sm:grid-cols-4 md:grid-cols-5">
                {galleryItems.map((g) => {
                  const selected = form.imageUrl === g.url;
                  return (
                    <button key={g.url} type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: g.url, caption: f.caption || g.caption }))}
                      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition ${selected ? "border-rose-400" : "border-transparent hover:border-white/25"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.caption} className="h-full w-full object-cover" loading="lazy" />
                      {selected && (
                        <span className="absolute inset-0 grid place-items-center bg-rose-500/40">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-rose-600"><Check size={18} /></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div><label className="label">لینک تصویر</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input mt-1.5" dir="ltr" placeholder="https://..." /></div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">لاین</label>
              <select value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} className="input mt-1.5">
                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">توضیح (اختیاری)</label><input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="input mt-1.5" /></div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy || !form.imageUrl} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} افزودن</button>
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
