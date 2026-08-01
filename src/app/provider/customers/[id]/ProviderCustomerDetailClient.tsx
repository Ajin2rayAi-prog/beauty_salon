"use client";

import { useState } from "react";
import { Save, Loader2, MessageCircle, Palette, AlertTriangle, Sparkles, StickyNote, CalendarClock, History, NotebookPen, Send } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatNumber, toJalali } from "@/lib/utils";

type Detail = {
  id: string; name: string; phone: string;
  hairFormula: string; allergies: string; skinNotes: string; notes: string; birthday: string;
};
type Hist = { id: string; startAt: string; status: string; amount: number; line: string; service: string; notes: string };
type Note = { id: string; text: string; authorName: string; createdAt: string; mine: boolean };

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "در انتظار", cls: "text-amber-300" },
  CONFIRMED: { label: "تأییدشده", cls: "text-sky-300" },
  DONE: { label: "انجام‌شده", cls: "text-mint-300" },
  CANCELLED: { label: "لغوشده", cls: "text-white/40" },
  NO_SHOW: { label: "غیبت", cls: "text-red-300" },
};

function waLink(phone: string) {
  const d = phone.replace(/[^\d]/g, "").replace(/^0/, "98");
  return `https://wa.me/${d}`;
}

export function ProviderCustomerDetailClient({ initial, history, notes: initialNotes }: { initial: Detail; history: Hist[]; notes: Note[] }) {
  const [c, setC] = useState<Detail>(initial);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const set = <K extends keyof Detail>(k: K, v: Detail[K]) => setC((x) => ({ ...x, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/provider/customers", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: c.id, hairFormula: c.hairFormula, allergies: c.allergies, skinNotes: c.skinNotes, notes: c.notes, birthday: c.birthday || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      toast.success("پرونده ذخیره شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/provider/customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: c.id, text: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setNotes((n) => [{ id: data.note.id, text: data.note.text, authorName: data.note.authorName, createdAt: data.note.createdAt, mine: true }, ...n]);
      setDraft("");
      toast.success("یادداشت ثبت شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      {/* Left: record editor */}
      <div className="space-y-5">
        <div className="card-glow relative overflow-hidden p-6">
          <div className="blob -left-8 -bottom-10 h-40 w-40 bg-plum-500/15" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-gradient text-xl font-black text-white">{c.name.charAt(0)}</div>
              <div>
                <h1 className="text-xl font-black">{c.name}</h1>
                <p className="text-sm text-white/45" dir="ltr">{c.phone}</p>
              </div>
            </div>
            <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-xs text-mint-200">
              <MessageCircle size={15} /> واتساپ
            </a>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <div>
            <label className="label flex items-center gap-1.5"><Palette size={13} className="text-rose-300" /> فرمول رنگ مو</label>
            <textarea value={c.hairFormula} onChange={(e) => set("hairFormula", e.target.value)} className="input mt-1.5 min-h-16" placeholder="مثلاً: 7.1 + 8.0 اکسیدان ۶٪ — ۳۵ دقیقه" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><AlertTriangle size={13} className="text-amber-400" /> حساسیت‌ها</label>
            <textarea value={c.allergies} onChange={(e) => set("allergies", e.target.value)} className="input mt-1.5 min-h-16" placeholder="حساسیت به مواد خاص، آلرژی پوستی…" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Sparkles size={13} className="text-mint-300" /> یادداشت پوست/مو</label>
            <textarea value={c.skinNotes} onChange={(e) => set("skinNotes", e.target.value)} className="input mt-1.5 min-h-16" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5"><StickyNote size={13} /> یادداشت کلی</label>
              <input value={c.notes} onChange={(e) => set("notes", e.target.value)} className="input mt-1.5" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><CalendarClock size={13} /> تاریخ تولد</label>
              <input type="date" value={c.birthday} onChange={(e) => set("birthday", e.target.value)} className="input mt-1.5" dir="ltr" />
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-rose px-5 py-2.5 text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ذخیره پرونده
          </button>
        </div>
      </div>

      {/* Right: per-visit notes + history */}
      <div className="space-y-5">
        <div className="card relative overflow-hidden p-6">
          <div className="blob -right-6 -top-8 h-32 w-32 bg-rose-400/15" />
          <h3 className="relative flex items-center gap-2 font-black"><NotebookPen size={16} className="text-rose-300" /> یادداشت هر ویزیت</h3>
          <div className="relative mt-4 flex gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="input min-h-12 flex-1" placeholder="یادداشت این ویزیت را بنویسید…" />
            <button onClick={addNote} disabled={posting || !draft.trim()} className="btn-rose shrink-0 self-stretch px-4" title="ثبت یادداشت">
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="relative mt-4 text-sm text-white/40">هنوز یادداشتی ثبت نشده است.</p>
          ) : (
            <ul className="relative mt-4 space-y-2.5">
              {notes.map((n) => (
                <li key={n.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <p className="text-sm leading-6 text-white/85">{n.text}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
                    <span className={n.mine ? "text-rose-300" : ""}>{n.mine ? "شما" : n.authorName}</span>
                    <span>•</span>
                    <span>{toJalali(new Date(n.createdAt))}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-black"><History size={16} className="text-plum-300" /> سابقهٔ خدمات شما ({formatNumber(history.length)})</h3>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">نوبتی ثبت نشده است.</p>
          ) : (
            <ol className="mt-4 space-y-3 border-r border-white/[0.08] pr-4">
              {history.map((h) => {
                const st = STATUS[h.status] ?? STATUS.PENDING;
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-plum-400" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{h.line}{h.service ? ` • ${h.service}` : ""}</p>
                      <span className={`text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {toJalali(new Date(h.startAt))}{h.amount ? ` • ${formatPrice(h.amount)}` : ""}
                    </p>
                    {h.notes && <p className="mt-1 rounded-lg bg-white/[0.03] px-2 py-1 text-[11px] text-white/55">درخواست مشتری: {h.notes}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
