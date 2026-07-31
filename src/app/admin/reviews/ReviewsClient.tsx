"use client";

import { useState } from "react";
import { Star, Check, X, Trash2, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { toJalali } from "@/lib/utils";

type Review = { id: string; authorName: string; rating: number; text: string; approved: boolean; createdAt: string; providerName?: string | null };

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? "fill-gold-300 text-gold-300" : "text-white/20"} />
      ))}
    </span>
  );
}

export function ReviewsClient({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState<Review[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const pending = items.filter((r) => !r.approved);
  const approved = items.filter((r) => r.approved);

  async function setApproved(r: Review, approved: boolean) {
    setBusy(r.id);
    const prev = items;
    setItems((x) => x.map((it) => (it.id === r.id ? { ...it, approved } : it)));
    const res = await fetch(`/api/admin/reviews/${r.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }),
    });
    setBusy(null);
    if (!res.ok) { setItems(prev); toast.error("خطا"); }
    else toast.success(approved ? "تأیید و منتشر شد" : "از سایت برداشته شد");
  }

  async function remove(r: Review) {
    if (!confirm("حذف این نظر؟")) return;
    const prev = items;
    setItems((x) => x.filter((it) => it.id !== r.id));
    const res = await fetch(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
    if (!res.ok) { setItems(prev); toast.error("خطا در حذف"); }
  }

  const Card = ({ r }: { r: Review }) => (
    <div className="card animate-fade-up p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{r.authorName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Stars n={r.rating} />
            <span className="text-[11px] text-white/40">{toJalali(new Date(r.createdAt))}</span>
            <span className="badge text-[10px] text-plum-200">{r.providerName ? `دربارهٔ ${r.providerName}` : "دربارهٔ سالن"}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {r.approved ? (
            <button disabled={busy === r.id} onClick={() => setApproved(r, false)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-white/60 hover:bg-white/[0.1]" title="برداشتن از سایت">
              {busy === r.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
            </button>
          ) : (
            <button disabled={busy === r.id} onClick={() => setApproved(r, true)} className="grid h-9 w-9 place-items-center rounded-xl bg-mint-500/15 text-mint-300 hover:bg-mint-500/25" title="تأیید و انتشار">
              {busy === r.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            </button>
          )}
          <button onClick={() => remove(r)} className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={15} /></button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/70">{r.text}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300"><Clock size={15} /> در انتظار تأیید ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="card p-6 text-center text-sm text-white/40">نظر جدیدی برای بررسی نیست.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">{pending.map((r) => <Card key={r.id} r={r} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-mint-300"><Check size={15} /> منتشرشده روی سایت ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="card p-6 text-center text-sm text-white/40">هنوز نظری منتشر نشده است.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">{approved.map((r) => <Card key={r.id} r={r} />)}</div>
        )}
      </section>
    </div>
  );
}
