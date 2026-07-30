import { requireRole, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/Badge";
import { timeAgo } from "@/lib/utils";
import { Bell, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);

  const [notifications, smsLogs] = await Promise.all([
    prisma.notification.findMany({ where: { salonId }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.smsLog.findMany({ where: { salonId }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  return (
    <div className="relative space-y-8">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-rose-500/18" />
      <div className="animate-fade-up">
        <span className="eyebrow"><Bell size={14} /> اعلان‌ها</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          اعلان‌ها و <span className="text-gradient">پیامک‌ها</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">اعلان‌های داخل پنل و تاریخچه‌ی پیامک‌های ارسالی.</p>
      </div>

      <div className="card relative overflow-hidden p-6 animate-fade-up delay-1">
        <h2 className="mb-4 flex items-center gap-2 font-black"><Bell size={18} className="text-rose-300" /> اعلان‌های اخیر</h2>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`rounded-2xl border p-4 transition hover:bg-white/[0.03] ${n.read ? "border-white/[0.06] bg-white/[0.02]" : "border-rose-400/25 bg-rose-400/[0.05]"}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{n.title}</p>
                <span className="text-[11px] text-white/35">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-white/60">{n.body}</p>
            </div>
          ))}
          {notifications.length === 0 && <p className="py-8 text-center text-white/40">اعلانی وجود ندارد.</p>}
        </div>
      </div>

      <div className="card overflow-x-auto p-2 sm:p-4 animate-fade-up delay-2">
        <h2 className="mb-3 flex items-center gap-2 px-2 pt-2 font-black"><MessageSquare size={18} className="text-plum-300" /> تاریخچه‌ی پیامک</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-right text-xs text-white/40">
              <th className="p-3 font-medium">گیرنده</th>
              <th className="p-3 font-medium">متن</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">هزینه</th>
              <th className="p-3 font-medium">زمان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {smsLogs.map((s) => (
              <tr key={s.id} className="text-white/80 transition hover:bg-white/[0.03]">
                <td className="p-3" dir="ltr">{s.to}</td>
                <td className="p-3 text-white/60">{s.message}</td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3 text-white/50">{s.cost ? `${s.cost} ت` : "—"}</td>
                <td className="p-3 text-white/40">{timeAgo(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {smsLogs.length === 0 && <p className="py-8 text-center text-white/40">پیامکی ارسال نشده است.</p>}
      </div>
    </div>
  );
}
