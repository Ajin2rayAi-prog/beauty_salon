import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/Badge";
import { formatPrice, formatShortDate, formatTime, payMethodLabel } from "@/lib/utils";
import Link from "next/link";
import { CalendarHeart, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const user = await requireRole([ROLES.CUSTOMER]);

  // all Customer records bound to this user, then their appointments
  const customers = await prisma.customer.findMany({ where: { userId: user.id }, select: { id: true } });
  const ids = customers.map((c) => c.id);

  const appointments = ids.length
    ? await prisma.appointment.findMany({
        where: { customerId: { in: ids } },
        orderBy: { startAt: "desc" },
        include: { salon: true, line: true, provider: true, service: true },
      })
    : [];

  const now = new Date();
  const upcoming = appointments.filter((a) => a.startAt >= now && ["PENDING", "CONFIRMED"].includes(a.status));
  const past = appointments.filter((a) => !(a.startAt >= now && ["PENDING", "CONFIRMED"].includes(a.status)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">نوبت‌های من</h1>
        <p className="mt-1 text-sm text-white/50">نوبت‌های پیش‌رو و تاریخچه شما.</p>
      </div>

      <section>
        <h2 className="mb-3 font-bold text-rose-300">پیش‌رو</h2>
        {upcoming.length === 0 ? (
          <div className="card p-8 text-center">
            <CalendarHeart size={28} className="mx-auto text-white/25" />
            <p className="mt-3 text-white/45">نوبت پیش‌رویی ندارید.</p>
            <Link href="/" className="btn-rose mt-4 inline-block px-5 py-2.5 text-sm">رزرو نوبت جدید</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((a) => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{a.service?.name ?? a.line.name}</h3>
                    <p className="mt-0.5 text-xs text-white/45">{a.line.name} • {a.provider.title}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-white/70">
                  <p className="flex items-center gap-2"><CalendarHeart size={15} className="text-rose-300" /> {formatShortDate(a.startAt)} • {formatTime(a.startAt)}</p>
                  <p className="flex items-center gap-2"><MapPin size={15} className="text-plum-300" /> {a.salon.name}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="font-extrabold text-rose-300">{formatPrice(a.amount)}</span>
                  <span className="text-xs text-white/40">{payMethodLabel(a.payMethod)}</span>
                  <StatusBadge status={a.payStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-white/70">تاریخچه</h2>
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-right text-xs text-white/40">
                  <th className="p-3 font-medium">خدمت</th>
                  <th className="p-3 font-medium">سالن</th>
                  <th className="p-3 font-medium">تاریخ</th>
                  <th className="p-3 font-medium">مبلغ</th>
                  <th className="p-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {past.map((a) => (
                  <tr key={a.id} className="text-white/75">
                    <td className="p-3">{a.service?.name ?? a.line.name}</td>
                    <td className="p-3 text-white/55">{a.salon.name}</td>
                    <td className="p-3 text-white/55">{formatShortDate(a.startAt)}</td>
                    <td className="p-3 text-rose-300">{formatPrice(a.amount)}</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
