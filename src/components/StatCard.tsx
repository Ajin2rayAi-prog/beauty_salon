import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "rose",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "rose" | "plum" | "emerald" | "amber" | "sky" | "coral" | "mint" | "gold";
}) {
  const iconBg: Record<string, string> = {
    rose: "bg-rose-500/15 text-rose-300",
    plum: "bg-plum-500/15 text-plum-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    sky: "bg-sky-500/15 text-sky-300",
    coral: "bg-coral-500/15 text-coral-300",
    mint: "bg-mint-500/15 text-mint-300",
    gold: "bg-gold-400/15 text-gold-300",
  };
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/55">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", iconBg[accent])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
