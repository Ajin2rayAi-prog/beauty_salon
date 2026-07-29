import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitRevenue } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID || "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const SANDBOX = (process.env.ZARINPAL_SANDBOX ?? "true") !== "false";
const BASE = SANDBOX ? "https://sandbox.zarinpal.com/pg/v4/payment" : "https://api.zarinpal.com/pg/v4/payment";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:6060";

// GET /api/payment/verify?authority=..&appointmentId=..&Status=OK|NOK
// ZarinPal redirects here after payment.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("authority");
  const appointmentId = searchParams.get("appointmentId");
  const status = searchParams.get("Status");

  const fail = (msg: string) =>
    NextResponse.redirect(`${APP_URL}/s/book/success?id=${appointmentId}&pay=failed&reason=${encodeURIComponent(msg)}`);

  if (!authority || !appointmentId) return NextResponse.redirect(`${APP_URL}/?pay=invalid`);
  if (status !== "OK") return fail("پرداخت لغو شد");

  const pending = await prisma.pendingPayment.findUnique({ where: { authority } });
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { line: true } });
  if (!pending || !appt) return fail("پرداخت پیدا نشد");

  try {
    const res = await fetch(`${BASE}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: MERCHANT, authority, amount: pending.amount * 10 }),
    });
    const data = await res.json();
    const code = data?.data?.code;

    if (code === 100 || code === 101) {
      const refId = String(data?.data?.ref_id ?? "");
      const { salonShare, providerShare } = splitRevenue(pending.amount, appt.line.pricingMode, appt.line.commissionPercent);

      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: appointmentId },
          data: { payStatus: "DEPOSIT", status: "CONFIRMED" },
        }),
        prisma.payment.create({
          data: {
            salonId: appt.salonId, appointmentId, amount: pending.amount,
            method: "ONLINE", refId, salonShare, providerShare,
          },
        }),
        prisma.pendingPayment.update({ where: { authority }, data: { status: "APPROVED", refId } }),
      ]);

      return NextResponse.redirect(`${APP_URL}/s/book/success?id=${appointmentId}&pay=ok&ref=${refId}`);
    }
    return fail(`پرداخت تأیید نشد (${code ?? "?"})`);
  } catch (e) {
    return fail("خطا در تأیید پرداخت");
  }
}
