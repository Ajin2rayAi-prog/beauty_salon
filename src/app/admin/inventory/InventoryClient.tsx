"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2, Minus, AlertTriangle, Package, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatNumber } from "@/lib/utils";

type Product = {
  id: string; name: string; unit: string; stock: number; minStock: number;
  cost: number; price: number; active: boolean;
};

const UNITS = ["عدد", "گرم", "میلی‌لیتر", "بسته", "تیوب", "قوطی"];

export function InventoryClient({ initial }: { initial: Product[] }) {
  const [items, setItems] = useState<Product[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "عدد", stock: 0, minStock: 0, cost: 0, price: 0 });

  const low = items.filter((p) => p.active && p.stock <= p.minStock).length;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setItems((x) => [data.product, ...x]);
      setForm({ name: "", unit: "عدد", stock: 0, minStock: 0, cost: 0, price: 0 });
      setShowForm(false);
      toast.success("محصول اضافه شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت");
    } finally {
      setBusy(false);
    }
  }

  async function adjust(p: Product, delta: number) {
    const prev = items;
    setItems((x) => x.map((it) => (it.id === p.id ? { ...it, stock: Math.max(0, it.stock + delta) } : it)));
    const res = await fetch(`/api/admin/inventory/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adjust: delta }),
    });
    if (!res.ok) { setItems(prev); toast.error("خطا در بروزرسانی موجودی"); }
  }
  async function remove(p: Product) {
    if (!confirm(`حذف «${p.name}»؟`)) return;
    const prev = items;
    setItems((x) => x.filter((it) => it.id !== p.id));
    const res = await fetch(`/api/admin/inventory/${p.id}`, { method: "DELETE" });
    if (!res.ok) { setItems(prev); toast.error("خطا در حذف"); }
    else toast.success("حذف شد");
  }

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowForm((s) => !s)} className="btn-rose px-4 py-2.5 text-sm">
          <Plus size={16} /> قلم جدید
        </button>
        {low > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300">
            <AlertTriangle size={14} /> {formatNumber(low)} قلم کمتر از حد هشدار
          </span>
        )}
      </div>

      {showForm && (
        <form onSubmit={create} className="card-glow animate-fade-up grid gap-4 p-6 sm:grid-cols-3">
          <div className="sm:col-span-3"><label className="label">نام محصول / ماده مصرفی</label><input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input mt-1.5" placeholder="مثلاً رنگ موی بلوند" /></div>
          <div>
            <label className="label">واحد</label>
            <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className="input mt-1.5">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div><label className="label">موجودی</label><input type="number" min={0} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
          <div><label className="label">حد هشدار</label><input type="number" min={0} value={form.minStock} onChange={(e) => set("minStock", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
          <div><label className="label">قیمت خرید (تومان)</label><input type="number" min={0} value={form.cost} onChange={(e) => set("cost", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
          <div><label className="label">قیمت فروش (۰=مصرفی)</label><input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
          <div className="flex items-end gap-2">
            <button disabled={busy} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ثبت</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-3 py-2 text-sm"><X size={15} /></button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="card p-12 text-center text-white/45">
          <Package size={32} className="mx-auto text-white/25" />
          <p className="mt-3">هنوز قلمی در انبار ثبت نشده است.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => {
            const isLow = p.active && p.stock <= p.minStock;
            return (
              <div key={p.id} className={`card animate-fade-up p-4 ${isLow ? "border-amber-400/30" : ""}`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">خرید {formatPrice(p.cost)}{p.price > 0 ? ` • فروش ${formatPrice(p.price)}` : " • مصرفی"}</p>
                  </div>
                  <button onClick={() => remove(p)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"><Trash2 size={14} /></button>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] p-2">
                  <button onClick={() => adjust(p, -1)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1]"><Minus size={16} /></button>
                  <div className="text-center">
                    <p className={`text-xl font-black ${isLow ? "text-amber-300" : "text-mint-300"}`}>{formatNumber(p.stock)}</p>
                    <p className="text-[10px] text-white/40">{p.unit} {isLow && "• کم"}</p>
                  </div>
                  <button onClick={() => adjust(p, 1)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1]"><Plus size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
