import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { iranianDayIndex } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { getSalonEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

// POST /api/public/book
// body: { salonId, lineId, providerId, serviceId, date: "YYYY-MM-DD", time: "HH:MM",
//         name, phone, payMethod: "IN_PERSON"|"ONLINE", notes? }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const { salonId, lineId, providerId, serviceId, date, time, name, phone, payMethod, notes } = body as any;

  if (!salonId || !lineId || !providerId || !date || !time || !name || !phone) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  const [line, provider, service] = await Promise.all([
    prisma.line.findUnique({ where: { id: lineId } }),
    prisma.provider.findUnique({ where: { id: providerId }, include: { schedules: true } }),
    serviceId ? prisma.service.findUnique({ where: { id: serviceId } }) : Promise.resolve(null),
  ]);
  if (!line || !provider || line.salonId !== salonId || provider.salonId !== salonId) {
    return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
  }
  if (!provider.active || !line.active) {
    return NextResponse.json({ error: "این لاین یا خدمت‌دهنده غیرفعال است" }, { status: 400 });
  }

  const durationMin = service?.durationMin ?? 60;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const startAt = new Date(y, m - 1, d, hh, mm, 0, 0);
  const endAt = new Date(startAt.getTime() + durationMin * 60000);

  // verify the requested time falls inside the provider's schedule
  const dow = iranianDayIndex(startAt);
  const sched = provider.schedules.find((s) => s.dayOfWeek === dow);
  if (!sched || sched.isOff) {
    return NextResponse.json({ error: "خدمت‌دهنده در این روز کار نمی‌کند" }, { status: 400 });
  }
  const [sh, smin] = sched.startTime.split(":").map(Number);
  const [eh, emin] = sched.endTime.split(":").map(Number);
  const winStart = new Date(y, m - 1, d, sh, smin, 0, 0);
  const winEnd = new Date(y, m - 1, d, eh, emin, 0, 0);
  if (startAt < winStart || endAt > winEnd) {
    return NextResponse.json({ error: "این ساعت خارج از بازه کاری است" }, { status: 400 });
  }

  // conflict check (double-booking)
  const conflict = await prisma.appointment.findFirst({
    where: {
      providerId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "این ساعت قبلاً رزرو شده است" }, { status: 409 });
  }

  // find or create customer (scoped to salon by phone)
  let customer = await prisma.customer.findUnique({ where: { salonId_phone: { salonId, phone } } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { salonId, name, phone, userId: (session?.user as any)?.id ?? null },
    });
  } else if (session?.user && !customer.userId) {
    customer = await prisma.customer.update({ where: { id: customer.id }, data: { userId: (session.user as any).id } });
  }

  const amount = service?.price ?? 0;
  const method = payMethod === "ONLINE" ? "ONLINE" : "IN_PERSON";
  const deposit = method === "ONLINE" ? Math.max(1, Math.round(amount * 0.3)) : 0;

  const appointment = await prisma.appointment.create({
    data: {
      salonId, lineId, providerId, serviceId: serviceId ?? null, customerId: customer.id,
      startAt, endAt, status: "PENDING", payMethod: method,
      payStatus: method === "ONLINE" ? "UNPAID" : "UNPAID",
      amount, deposit, notes: notes ?? null,
    },
  });

  // in-panel notification to provider + salon
  await prisma.notification.createMany({
    data: [
      {
        salonId,
        title: "نوبت جدید ثبت شد",
        body: `${name} — ${line.name} در ${new Date(startAt).toLocaleString("fa-IR")}`,
        type: "APPOINTMENT",
        link: "/admin/appointments",
      },
    ],
  });

  // confirmation SMS to the customer (best-effort, gated by the reminders feature)
  try {
    const ent = await getSalonEntitlements(salonId);
    if (ent.features.reminders) {
      const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { name: true } });
      const when = new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium", timeStyle: "short",
      }).format(startAt);
      await notify({
        salonId,
        phone,
        title: "ثبت نوبت",
        body: `${salon?.name ?? "سالن"}: نوبت شما (${line.name}) برای ${when} ثبت شد.`,
      });
    }
  } catch (e) {
    console.error("book:notify failed", e);
  }

  // ONLINE: create pending payment + return ZarinPal request payload
  if (method === "ONLINE") {
    const authority = `PENDING-${appointment.id}`;
    await prisma.pendingPayment.create({
      data: { salonId, authority, amount: deposit, appointmentId: appointment.id, customerPhone: phone },
    });
    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
      online: true,
      deposit,
      authority,
      message: "برای تکمیل رزرو به درگاه منتقل می‌شوید",
      // caller will POST this authority to /api/payment/request
    });
  }

  return NextResponse.json({ ok: true, appointmentId: appointment.id, online: false, message: "نوبت شما ثبت شد و در انتظار تأیید است" });
}
