import { NextResponse } from "next/server";
import { requireRoleApi, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { splitRevenue } from "@/lib/utils";
import { getSalonEntitlements } from "@/lib/entitlements";
import { awardLoyaltyForPayment } from "@/lib/loyalty";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = await activeSalonId(user);

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { line: true, customer: true },
  });
  if (!appt || appt.salonId !== salonId) {
    return NextResponse.json({ error: "نوبت پیدا نشد" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  let message = "انجام شد";
  const update: any = {};

  if (action === "confirm") {
    update.status = "CONFIRMED";
    message = "نوبت تأیید شد";
  } else if (action === "done") {
    update.status = "DONE";
    message = "نوبت انجام شد";
  } else if (action === "cancel") {
    update.status = "CANCELLED";
    message = "نوبت لغو شد";
  } else if (action === "pay") {
    // record in-person payment + revenue split
    update.payStatus = "PAID";
    const { salonShare, providerShare } = splitRevenue(appt.amount, appt.line.pricingMode, appt.line.commissionPercent);
    await prisma.payment.create({
      data: {
        salonId: appt.salonId,
        appointmentId: appt.id,
        amount: appt.amount,
        method: "IN_PERSON",
        salonShare,
        providerShare,
      },
    });
    // Loyalty: award points if the salon has the باشگاه مشتریان feature.
    const ent = await getSalonEntitlements(appt.salonId);
    if (ent.features.loyalty) {
      await awardLoyaltyForPayment(appt.customerId, appt.amount);
    }
    message = "پرداخت ثبت شد";
  } else {
    return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: update,
    select: { id: true, status: true, payStatus: true },
  });

  // in-panel notification for the customer (best-effort)
  if (appt.customer.userId) {
    await prisma.notification.create({
      data: {
        salonId: appt.salonId,
        userId: appt.customer.userId,
        title: action === "cancel" ? "نوبت شما لغو شد" : action === "confirm" ? "نوبت شما تأیید شد" : action === "pay" ? "پرداخت شما ثبت شد" : "وضعیت نوبت تغییر کرد",
        body: `${appt.line.name} — ${new Date(appt.startAt).toLocaleString("fa-IR")}`,
        type: "APPOINTMENT",
        link: "/customer",
      },
    });
  }

  // SMS the customer when a booking is confirmed or cancelled (gated by reminders)
  if ((action === "confirm" || action === "cancel") && appt.customer.phone) {
    try {
      const ent = await getSalonEntitlements(appt.salonId);
      if (ent.features.reminders) {
        const when = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(appt.startAt);
        await notify({
          salonId: appt.salonId,
          phone: appt.customer.phone,
          title: action === "confirm" ? "تأیید نوبت" : "لغو نوبت",
          body: action === "confirm"
            ? `نوبت شما (${appt.line.name}) برای ${when} تأیید شد.`
            : `نوبت شما (${appt.line.name}) برای ${when} لغو شد.`,
        });
      }
    } catch (e) {
      console.error("appointment:notify failed", e);
    }
  }

  return NextResponse.json({ ok: true, appointment, message });
}
