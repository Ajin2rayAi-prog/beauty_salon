import { requireRole, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { AppointmentsClient } from "./AppointmentsClient";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; lineId?: string; providerId?: string };
}) {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = user.salonId!;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">نوبت‌ها</h1>
        <p className="mt-1 text-sm text-white/50">تأیید، لغو، انجام و ثبت پرداخت نوبت‌ها.</p>
      </div>
      <AppointmentsClient
        initialAppointments={JSON.parse(JSON.stringify(appointments))}
        lines={lines}
        providers={providers}
      />
    </div>
  );
}
