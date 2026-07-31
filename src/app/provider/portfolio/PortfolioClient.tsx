"use client";

import { useState } from "react";
import { Camera, Plus, Loader2, Trash2, X, Check, Image as ImageIcon, Heart, MessageCircle, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { GALLERY, providerAvatar } from "@/lib/images";
import { PhotoField } from "@/components/PhotoField";
import { toJalali } from "@/lib/utils";

type LineOpt = { id: string; name: string };
type Comment = { id: string; authorName: string; text: string; createdAt: string; approved: boolean };
type Item = {
  id: string; imageUrl: string; caption: string | null; likes: number; createdAt: string;
  lineId: string | null; line: { id: string; name: string } | null; comments: Comment[];
};

export function PortfolioClient({
  providerId, providerName, providerPhoto, lines, initialItems,
}: {
  providerId: string; providerName: string; providerPhoto: string | null;
  lines: LineOpt[]; initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ imageUrl: "", caption: "", lineId: lines[0]?.id ?? "" });
  const [src, setSrc] = useState<"upload" | "gallery">("upload");
  const [galleryCat, setGalleryCat] = useState("all");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(GALLERY.map((g) => g.category)))];
  const galleryItems = galleryCat === "all" ? GALLERY : GALLERY.filter((g) => g.category === galleryCat);
  const avatar = providerPhoto || providerAvatar(providerId);

  function openCompose() {
    setEditingId(null);
    setForm({ imageUrl: "", caption: "", lineId: lines[0]?.id ?? "" });
    setSrc("upload");
    setComposing(true);
  }
  function openEdit(it: Item) {
    setEditingId(it.id);
    setForm({ imageUrl: it.imageUrl, caption: it.caption ?? "", lineId: it.lineId ?? "" });
    setSrc("upload");
    setComposing(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeCompose() { setComposing(false); setEditingId(null); }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) { toast.error("ابتدا یک عکس انتخاب کنید"); return; }
    setBusy(true);
    try {
      const editing = !!editingId;
      const res = await fetch("/api/provider/portfolio", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { id: editingId, ...form, lineId: form.lineId || null }
            : { providerId, ...form, lineId: form.lineId || null }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      if (editing) {
        setItems((list) => list.map((x) => (x.id === editingId ? data.item : x)));
        toast.success("پست ویرایش شد");
      } else {
        setItems((list) => [data.item, ...list]);
        toast.success("پست منتشر شد");
      }
      closeCompose();
    } catch (err: any) {
      toast.error(err.message || "خطا");
    } finally { setBusy(false); }
  }

  async function removePost(id: string) {
    if (!confirm("این پست حذف شود؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/provider/portfolio?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا");
      setItems((list) => list.filter((x) => x.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا در حذف"); }
    finally { setDeleting(null); }
  }

  async function removeComment(postId: string, commentId: string) {
    const res = await fetch(`/api/provider/portfolio/comment?id=${commentId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("خطا در حذف دیدگاه"); return; }
    setItems((list) => list.map((x) => (x.id === postId ? { ...x, comments: x.comments.filter((c) => c.id !== commentId) } : x)));
    toast.success("دیدگاه حذف شد");
  }

  async function approveComment(postId: string, commentId: string) {
    const res = await fetch("/api/provider/portfolio/comment", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commentId }),
    });
    if (!res.ok) { toast.error("خطا در تأیید دیدگاه"); return; }
    setItems((list) => list.map((x) => (x.id === postId ? { ...x, comments: x.comments.map((c) => (c.id === commentId ? { ...c, approved: true } : c)) } : x)));
    toast.success("دیدگاه تأیید و منتشر شد");
  }
  // PLACEHOLDER_RENDER
  return (
    <div className="space-y-6">
      {!composing && (
        <button onClick={openCompose} className="btn-rose px-4 py-2.5 text-sm">
          <Plus size={16} /> پست جدید
        </button>
      )}

      {composing && (
        <form onSubmit={submitPost} className="card mx-auto max-w-md animate-fade-up space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-black">
              <Camera size={16} className="text-rose-300" /> {editingId ? "ویرایش پست" : "پست جدید"}
            </h2>
            <button type="button" onClick={closeCompose} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.12]"><X size={15} /></button>
          </div>

          {/* image source: upload/link vs stock gallery */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setSrc("upload")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${src === "upload" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
              <Camera size={14} /> آپلود / لینک
            </button>
            <button type="button" onClick={() => setSrc("gallery")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${src === "gallery" ? "bg-rose-gradient text-white" : "bg-white/[0.05] text-white/55 hover:text-white/80"}`}>
              <ImageIcon size={14} /> گالری آماده
            </button>
          </div>

          {src === "upload" ? (
            <PhotoField value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} shape="square" label="عکس پست (کراپ و افکت هنگام آپلود)" />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setGalleryCat(cat)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${galleryCat === cat ? "bg-rose-500/25 text-rose-100" : "bg-white/[0.04] text-white/50 hover:text-white/75"}`}>
                    {cat === "all" ? "همه" : cat}
                  </button>
                ))}
              </div>
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-white/[0.06] p-2 sm:grid-cols-4">
                {galleryItems.map((g) => {
                  const selected = form.imageUrl === g.url;
                  return (
                    <button key={g.url} type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: g.url, caption: f.caption || g.caption }))}
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition ${selected ? "border-rose-400" : "border-transparent hover:border-white/25"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} alt={g.caption} className="h-full w-full object-cover" loading="lazy" />
                      {selected && <span className="absolute inset-0 grid place-items-center bg-rose-500/40"><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-rose-600"><Check size={18} /></span></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* PLACEHOLDER_COMPOSER2 */}
          <div>
            <label className="label">کپشن</label>
            <textarea value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              maxLength={2000} rows={3} className="input mt-1.5 resize-none" placeholder="دربارهٔ این کار بنویسید…" />
            <p className="mt-1 text-left text-[10px] text-white/35">{form.caption.length}/۲۰۰۰</p>
          </div>
          <div>
            <label className="label">لاین مرتبط</label>
            <select value={form.lineId} onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))} className="input mt-1.5">
              <option value="">بدون لاین</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button disabled={busy || !form.imageUrl} className="btn-rose flex-1 justify-center px-4 py-2.5 text-sm">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {editingId ? "ذخیره ویرایش" : "اشتراک‌گذاری"}
            </button>
            <button type="button" onClick={closeCompose} className="btn-ghost px-3 py-2.5 text-sm"><X size={15} /> انصراف</button>
          </div>
        </form>
      )}
      {/* PLACEHOLDER_FEED */}
      {items.length === 0 && !composing ? (
        <div className="card p-12 text-center text-white/45">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-coral-500/10 text-coral-300"><Camera size={30} /></div>
          <p className="mt-4">هنوز پستی منتشر نکرده‌اید.</p>
        </div>
      ) : (
        // mobile: single column feed; desktop: 4 posts per row
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((it, i) => (
            <article key={it.id} className="card animate-fade-up flex flex-col overflow-hidden p-0" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* header */}
              <div className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-400/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{providerName}</p>
                  {it.line && <p className="text-[11px] text-white/45">{it.line.name}</p>}
                </div>
                <button onClick={() => openEdit(it)} title="ویرایش" className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-white/60 hover:bg-white/[0.12] hover:text-white"><Pencil size={14} /></button>
                <button onClick={() => removePost(it.id)} disabled={deleting === it.id} title="حذف پست" className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 text-red-300 hover:bg-red-500/20">
                  {deleting === it.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              {/* image */}
              <div className="aspect-square overflow-hidden bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.imageUrl} alt={it.caption ?? ""} className="h-full w-full object-cover" />
              </div>
              {/* actions */}
              <div className="flex items-center gap-4 px-3 pt-3 text-sm">
                <span className="flex items-center gap-1.5"><Heart size={18} className="fill-rose-500 text-rose-500" /> {it.likes.toLocaleString("fa-IR")}</span>
                <span className="flex items-center gap-1.5 text-white/70"><MessageCircle size={18} /> {it.comments.length.toLocaleString("fa-IR")}</span>
                <span className="mr-auto text-[11px] text-white/40">{toJalali(it.createdAt)}</span>
              </div>
              {/* caption */}
              {it.caption && <p className="px-3 pt-2 text-sm leading-6"><b className="font-bold">{providerName}</b>{" "}<span className="text-white/80">{it.caption}</span></p>}
              {/* comments (provider moderates) */}
              <div className="mt-auto space-y-2 px-3 py-3">
                {it.comments.length === 0 ? (
                  <p className="text-[11px] text-white/35">هنوز دیدگاهی ثبت نشده.</p>
                ) : it.comments.map((c) => (
                  <div key={c.id} className="group flex items-start gap-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <b className="font-bold">{c.authorName}</b>{" "}
                      <span className="text-white/75">{c.text}</span>
                      {!c.approved && <span className="mr-1.5 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">در انتظار تأیید</span>}
                    </span>
                    {!c.approved && (
                      <button onClick={() => approveComment(it.id, c.id)} title="تأیید و انتشار" className="shrink-0 text-emerald-300/80 transition hover:text-emerald-200"><Check size={14} /></button>
                    )}
                    <button onClick={() => removeComment(it.id, c.id)} title="حذف دیدگاه" className="shrink-0 text-white/30 opacity-0 transition hover:text-red-300 group-hover:opacity-100"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
