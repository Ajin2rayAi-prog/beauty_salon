import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID || "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const SANDBOX = (process.env.ZARINPAL_SANDBOX ?? "true") !== "false";
const BASE = SANDBOX ? "https://sandbox.zarinpal.com/pg/v4/payment" : "https://api.zarinpal.com/pg/v4/payment";
const STARTPAY = SANDBOX ? "https://sandbox.zarinpal.com/pg/StartPay" : "https://www.zarinpal.com/pg/StartPay";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:6060";

// POST /api/payment/request  { authority, appointmentId }
// Creates a ZarinPal payment request for the appointment deposit.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { authority, appointmentId } = body as any;
  if (!authority || !appointmentId) {
    return NextResponse.json({ error: "پارامتر ناقص" }, { status: 400 });
  }

  const pending = await prisma.pendingPayment.findUnique({ where: { authority } });
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { service: true, customer: true } });
  if (!pending || !appt) return NextResponse.json({ error: "پرداخت پیدا نشد" }, { status: 404 });

  const callbackUrl = `${APP_URL}/api/payment/verify?authority=${authority}&appointmentId=${appointmentId}`;

  try {
    const res = await fetch(`${BASE}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT,
        amount: pending.amount * 10, // toman -> rial
        callback_url: callbackUrl,
        description: `بیعانه نوبت ${appt.service?.name ?? "خدمت"} — ${appt.customer.name}`,
        metadata: { mobile: pending.customerPhone ?? "" },
      }),
    });
    const data = await res.json();
    const code = data?.data?.code;
    const zauth = data?.data?.authority;

    if (code === 100 && zauth) {
      await prisma.pendingPayment.update({ where: { authority }, data: { authority: zauth } });
      return NextResponse.json({ ok: true, url: `${STARTPAY}/${zauth}`, authority: zauth });
    }
    return NextResponse.json({ error: `خطای درگاه (${code ?? "?"})` }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: "اتصال به درگاه ممکن نشد" }, { status: 502 });
  }
}
