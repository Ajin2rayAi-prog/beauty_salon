import { requireRole, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { AppointmentsClient } from "./AppointmentsClient";
import { CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; lineId?: string; providerId?: string };
}) {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);

  const where: any = { salonId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.lineId) where.lineId = searchParams.lineId;
  if (searchParams.providerId) where.providerId = searchParams.providerId;

  const [appointments, lines, providers] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startAt: "desc" },
      take: 100,
      include: { customer: true, provider: true, line: true, service: true },
    }),
    prisma.line.findMany({ where: { salonId, active: true }, select: { id: true, name: true } }),
    prisma.provider.findMany({ where: { salonId, active: true }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="relative space-y-6">
      <div className="blob -right-10 -top-16 h-56 w-56 bg-sky-500/15" />
      <div className="animate-fade-up">
        <span className="eyebrow"><CalendarClock size={14} /> مدیریت نوبت‌ها</span>
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          نوبت‌های <span className="text-gradient">سالن</span>
        </h1>
        <p className="mt-2 text-sm text-white/55">تأیید، لغو، انجام و ثبت پرداخت نوبت‌ها.</p>
      </div>
      <AppointmentsClient
        initialAppointments={JSON.parse(JSON.stringify(appointments))}
        lines={lines}
        providers={providers}
      />
    </div>
  );
}
