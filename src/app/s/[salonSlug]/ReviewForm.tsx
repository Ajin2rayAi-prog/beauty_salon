"use client";

import { useState } from "react";
import { Star, Send, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

export function ReviewForm({ salonId }: { salonId: string }) {
  const [authorName, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, authorName, text, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setDone(true);
      toast.success("نظرت ثبت شد و پس از تأیید نمایش داده می‌شه");
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت نظر");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mint-500/15 text-mint-300"><Check size={22} /></div>
        <p className="mt-4 font-bold">ممنون از نظرت!</p>
        <p className="mt-1 text-sm text-white/50">بعد از تأیید مدیر سالن روی صفحه نمایش داده می‌شه.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-lg space-y-4 p-6">
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} className="p-1">
            <Star size={26} className={i <= (hover || rating) ? "fill-gold-300 text-gold-300" : "text-white/25"} />
          </button>
        ))}
      </div>
      <input required value={authorName} onChange={(e) => setName(e.target.value)} className="input" placeholder="نام شما" />
      <textarea required value={text} onChange={(e) => setText(e.target.value)} className="input min-h-24" placeholder="تجربه‌ات از سالن رو بنویس…" maxLength={600} />
      <button disabled={busy} className="btn-rose w-full py-2.5 text-sm">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} ثبت نظر
      </button>
    </form>
  );
}
