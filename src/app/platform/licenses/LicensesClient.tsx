"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { BadgeCheck, Loader2, Pencil, X, Save, Store, Infinity as InfinityIcon } from "lucide-react";
import { formatPrice, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

type License = {
  id: string; plan: string; status: string; priceIrr: number;
  maxSalons: number; maxLines: number; maxProviders: number; whiteLabel: boolean;
  endDate: string | null;
  tenant: { name: string; _count: { salons: number } };
};

function statusCls(status: string) {
  return status === "ACTIVE"
    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    : status === "SUSPENDED"
    ? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";
}
const STATUS_LABEL: Record<string, string> = { ACTIVE: "فعال", SUSPENDED: "معلق", EXPIRED: "منقضی" };
const limit = (n: number) => (n === 0 ? "نامحدود" : formatNumber(n));

export function LicensesClient({ initialLicenses }: { initialLicenses: License[] }) {
  const [licenses, setLicenses] = useState<License[]>(initialLicenses);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Partial<License>>({});

  function startEdit(l: License) {
    setEditing(l.id);
    setDraft({ plan: l.plan, status: l.status, priceIrr: l.priceIrr, maxSalons: l.maxSalons, maxLines: l.maxLines, maxProviders: l.maxProviders, whiteLabel: l.whiteLabel });
  }

  async function save(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/licenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ذخیره");
      setLicenses((ls) => ls.map((x) => (x.id === id ? { ...x, ...data.license } : x)));
      toast.success("لایسنس به‌روزرسانی شد");
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  }

  if (licenses.length === 0) {
    return (
      <div className="card p-12 text-center text-white/45">
        <BadgeCheck size={32} className="mx-auto text-white/25" />
        <p className="mt-3">هنوز لایسنسی صادر نشده است. از بخش کارفرماها یک کارفرمای جدید بسازید.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {licenses.map((l, i) => (
        <div key={l.id} className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 font-bold"><BadgeCheck size={16} className="text-emerald-300" /> {l.tenant.name}</h3>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/45"><Store size={12} /> {formatNumber(l.tenant._count.salons)} سالن</p>
            </div>
            {editing !== l.id && (
              <button onClick={() => startEdit(l)} className="btn-ghost px-2.5 py-1.5 text-xs"><Pencil size={13} /> ویرایش</button>
            )}
          </div>

          {editing === l.id ? (
            <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">پلن</label>
                  <select value={draft.plan} onChange={(e) => setDraft((d) => ({ ...d, plan: e.target.value }))} className="input mt-1.5">
                    <option value="STARTER">STARTER</option>
                    <option value="PRO">PRO</option>
                    <option value="WHITELABEL">WHITELABEL</option>
                  </select>
                </div>
                <div>
                  <label className="label">وضعیت</label>
                  <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} className="input mt-1.5">
                    <option value="ACTIVE">فعال</option>
                    <option value="SUSPENDED">معلق</option>
                    <option value="EXPIRED">منقضی</option>
                  </select>
                </div>
                <div><label className="label">قیمت (تومان)</label><input type="number" min={0} value={draft.priceIrr ?? 0} onChange={(e) => setDraft((d) => ({ ...d, priceIrr: Number(e.target.value) }))} className="input mt-1.5" dir="ltr" /></div>
                <div><label className="label">حداکثر سالن</label><input type="number" min={0} value={draft.maxSalons ?? 0} onChange={(e) => setDraft((d) => ({ ...d, maxSalons: Number(e.target.value) }))} className="input mt-1.5" dir="ltr" /></div>
                <div><label className="label">حداکثر لاین (۰=نامحدود)</label><input type="number" min={0} value={draft.maxLines ?? 0} onChange={(e) => setDraft((d) => ({ ...d, maxLines: Number(e.target.value) }))} className="input mt-1.5" dir="ltr" /></div>
                <div><label className="label">حداکثر خدمت‌دهنده (۰=نامحدود)</label><input type="number" min={0} value={draft.maxProviders ?? 0} onChange={(e) => setDraft((d) => ({ ...d, maxProviders: Number(e.target.value) }))} className="input mt-1.5" dir="ltr" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={!!draft.whiteLabel} onChange={(e) => setDraft((d) => ({ ...d, whiteLabel: e.target.checked }))} className="h-4 w-4 accent-rose-500" />
                وایت‌لیبل (لوگو و نام اختصاصی)
              </label>
              <div className="flex gap-2">
                <button onClick={() => save(l.id)} disabled={busy} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} ذخیره</button>
                <button onClick={() => setEditing(null)} className="btn-ghost px-3 py-2 text-sm"><X size={15} /> انصراف</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusCls(l.status)}>{STATUS_LABEL[l.status] ?? l.status}</Badge>
                <Badge className="text-rose-300 bg-rose-400/10 border-rose-400/20">{l.plan}</Badge>
                {l.whiteLabel && <Badge className="text-plum-300 bg-plum-400/10 border-plum-400/20">وایت‌لیبل</Badge>}
              </div>
              <p className="text-lg font-extrabold text-rose-300">{formatPrice(l.priceIrr)}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                  <p className="text-white/40">سالن</p>
                  <p className="mt-0.5 font-bold">{l.maxSalons === 0 ? <InfinityIcon size={14} className="mx-auto" /> : limit(l.maxSalons)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                  <p className="text-white/40">لاین</p>
                  <p className="mt-0.5 font-bold">{l.maxLines === 0 ? <InfinityIcon size={14} className="mx-auto" /> : limit(l.maxLines)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                  <p className="text-white/40">خدمت‌دهنده</p>
                  <p className="mt-0.5 font-bold">{l.maxProviders === 0 ? <InfinityIcon size={14} className="mx-auto" /> : limit(l.maxProviders)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
