"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Check, ChevronsUpDown, Loader2 } from "lucide-react";

type Salon = { id: string; name: string; active: boolean };

export function SalonSwitcher({ salons, activeId }: { salons: Salon[]; activeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = salons.find((s) => s.id === activeId) ?? salons[0];

  async function pick(id: string) {
    if (id === activeId) { setOpen(false); return; }
    setBusy(true);
    const res = await fetch("/api/admin/active-salon", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ salonId: id }),
    });
    setBusy(false);
    setOpen(false);
    if (res.ok) router.refresh();
  }

  if (salons.length <= 1) return null;

  return (
    <div className="relative mb-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-right text-sm transition hover:border-plum-400/30">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-plum-gradient text-white"><Store size={14} /></span>
        <span className="min-w-0 flex-1 truncate font-semibold">{active?.name ?? "—"}</span>
        {busy ? <Loader2 size={15} className="animate-spin text-white/40" /> : <ChevronsUpDown size={15} className="text-white/40" />}
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a0f26] shadow-xl">
          {salons.map((s) => (
            <button key={s.id} onClick={() => pick(s.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm transition hover:bg-white/[0.05]">
              <span className="min-w-0 flex-1 truncate">{s.name}{!s.active && <span className="mr-1 text-[10px] text-white/35">(غیرفعال)</span>}</span>
              {s.id === activeId && <Check size={14} className="text-mint-300" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
