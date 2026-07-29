import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/Badge";
import { timeAgo } from "@/lib/utils";
import { Bell, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

  const [notifications, smsLogs] = await Promise.all([
    prisma.notification.findMany({ where: { salonId }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.smsLog.findMany({ where: { salonId }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">اعلان‌ها و پیامک‌ها</h1>
        <p className="mt-1 text-sm text-white/50">اعلان‌های داخل پنل و تاریخچه‌ی پیامک‌های ارسالی.</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-extrabold"><Bell size={18} className="text-rose-300" /> اعلان‌های اخیر</h2>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 ${n.read ? "border-white/[0.05] bg-white/[0.02]" : "border-rose-400/20 bg-rose-400/[0.04]"}`}>
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

      <div className="card overflow-x-auto p-2 sm:p-4">
        <h2 className="mb-3 flex items-center gap-2 px-2 pt-2 font-extrabold"><MessageSquare size={18} className="text-plum-300" /> تاریخچه‌ی پیامک</h2>
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
              <tr key={s.id} className="text-white/80">
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
