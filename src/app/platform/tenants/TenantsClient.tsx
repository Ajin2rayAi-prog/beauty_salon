"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { Building2, Store, Plus, Loader2, X, ExternalLink, BadgeCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

type Salon = { id: string; name: string; slug: string; active: boolean };
type License = { id: string; plan: string; status: string; priceIrr: number };
type Tenant = {
  id: string; name: string; phone: string | null; email: string | null; createdAt: string;
  _count: { salons: number; users: number };
  salons: Salon[];
  licenses: License[];
};

const EMPTY = {
  tenantName: "", phone: "", email: "",
  adminName: "", adminEmail: "", adminPassword: "Salon@123",
  salonName: "", salonSlug: "", city: "",
  plan: "PRO", priceIrr: 0, maxSalons: 1,
};

export function TenantsClient({ initialTenants }: { initialTenants: Tenant[] }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const set = (k: keyof typeof EMPTY, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت");
      toast.success("کارفرما ساخته شد");
      setTenants((t) => [data.tenant, ...t]);
      setForm({ ...EMPTY });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={() => setShowForm((s) => !s)} className="btn-rose px-4 py-2.5 text-sm">
        <Plus size={16} /> کارفرمای جدید
      </button>

      {showForm && (
        <form onSubmit={createTenant} className="card space-y-5 p-5">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-300"><Building2 size={15} /> اطلاعات کارفرما</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">نام کارفرما / کسب‌وکار</label><input required value={form.tenantName} onChange={(e) => set("tenantName", e.target.value)} className="input mt-1.5" /></div>
              <div><label className="label">تلفن</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input mt-1.5" dir="ltr" /></div>
              <div><label className="label">ایمیل کارفرما</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input mt-1.5" dir="ltr" /></div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-plum-300"><Store size={15} /> سالن اولیه</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">نام سالن</label><input required value={form.salonName} onChange={(e) => set("salonName", e.target.value)} className="input mt-1.5" /></div>
              <div><label className="label">اسلاگ (آدرس /s/...)</label><input value={form.salonSlug} onChange={(e) => set("salonSlug", e.target.value)} className="input mt-1.5" dir="ltr" placeholder="از نام سالن ساخته می‌شود" /></div>
              <div><label className="label">شهر</label><input value={form.city} onChange={(e) => set("city", e.target.value)} className="input mt-1.5" /></div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-300"><Plus size={15} /> مدیر سالن</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">نام مدیر</label><input required value={form.adminName} onChange={(e) => set("adminName", e.target.value)} className="input mt-1.5" /></div>
              <div><label className="label">ایمیل ورود مدیر</label><input required type="email" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} className="input mt-1.5" dir="ltr" /></div>
              <div><label className="label">رمز اولیه</label><input value={form.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} className="input mt-1.5" dir="ltr" /></div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300"><BadgeCheck size={15} /> لایسنس</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">پلن</label>
                <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className="input mt-1.5">
                  <option value="STARTER">STARTER</option>
                  <option value="PRO">PRO</option>
                  <option value="WHITELABEL">WHITELABEL</option>
                </select>
              </div>
              <div><label className="label">قیمت (تومان)</label><input type="number" min={0} value={form.priceIrr} onChange={(e) => set("priceIrr", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
              <div><label className="label">حداکثر سالن</label><input type="number" min={1} value={form.maxSalons} onChange={(e) => set("maxSalons", Number(e.target.value))} className="input mt-1.5" dir="ltr" /></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button disabled={busy} className="btn-rose px-4 py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} ثبت کارفرما</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost px-3 py-2 text-sm"><X size={15} /> انصراف</button>
          </div>
        </form>
      )}

      <TenantList tenants={tenants} />
    </div>
  );
}

function statusCls(status: string) {
  return status === "ACTIVE"
    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    : status === "SUSPENDED"
    ? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";
}

function TenantList({ tenants }: { tenants: Tenant[] }) {
  if (tenants.length === 0) {
    return (
      <div className="card p-12 text-center text-white/45">
        <Building2 size={32} className="mx-auto text-white/25" />
        <p className="mt-3">هنوز کارفرمایی ثبت نشده است.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tenants.map((t) => (
        <div key={t.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 font-bold"><Building2 size={16} className="text-rose-300" /> {t.name}</h3>
              <p className="mt-1 text-xs text-white/45" dir="ltr">{t.email || t.phone || "—"}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {t.licenses.slice(0, 1).map((l) => (
                <Badge key={l.id} className={statusCls(l.status)}>{l.plan} • {formatPrice(l.priceIrr)}</Badge>
              ))}
              {t.licenses.length === 0 && <Badge className="text-amber-400 bg-amber-400/10 border-amber-400/20">بدون لایسنس</Badge>}
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
            {t.salons.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex min-w-0 items-center gap-2 text-white/75">
                  <Store size={14} className="shrink-0 text-plum-300" />
                  <span className="truncate">{s.name}</span>
                  {!s.active && <Badge className="text-zinc-400 bg-zinc-400/10 border-zinc-400/20 text-[10px]">غیرفعال</Badge>}
                </span>
                <Link href={`/s/${s.slug}`} target="_blank" className="inline-flex shrink-0 items-center gap-1 text-xs text-rose-300 hover:underline">
                  /s/{s.slug} <ExternalLink size={12} />
                </Link>
              </div>
            ))}
            {t.salons.length === 0 && <p className="text-xs text-white/35">سالنی ندارد</p>}
          </div>

          <p className="mt-3 text-[11px] text-white/35">{t._count.salons} سالن • {t._count.users} کاربر</p>
        </div>
      ))}
    </div>
  );
}
