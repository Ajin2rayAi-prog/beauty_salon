import { prisma } from "./prisma";

/**
 * Unified notification fan-out: in-panel Notification + SMS (Kavenegar) + Email.
 * SMS/email are best-effort and no-op when not configured (dev mode), so the
 * app runs fully without them. SMS cost is deducted from the salon's smsCredit.
 */

type NotifyInput = {
  salonId?: string | null;
  userId?: string | null; // in-panel recipient
  phone?: string | null; // sms recipient
  email?: string | null;
  title: string;
  body: string;
  type?: string;
  link?: string;
  smsText?: string; // optional shorter text for SMS; defaults to body
};

const SMS_COST = Number(process.env.SMS_COST_PER_MESSAGE ?? 400); // toman per SMS (placeholder)

export async function notify(input: NotifyInput) {
  const results: { panel?: boolean; sms?: string; email?: string } = {};

  // 1) In-panel notification
  if (input.userId) {
    try {
      await prisma.notification.create({
        data: {
          salonId: input.salonId ?? null,
          userId: input.userId,
          title: input.title,
          body: input.body,
          type: input.type ?? "SYSTEM",
          link: input.link ?? null,
        },
      });
      results.panel = true;
    } catch (e) {
      console.error("notify:panel failed", e);
    }
  }

  // 2) SMS via Kavenegar (best effort)
  if (input.phone) {
    results.sms = await sendSms(input.salonId ?? null, input.phone, input.smsText ?? input.body);
  }

  // 3) Email (best effort, skipped if SMTP not configured)
  if (input.email) {
    results.email = await sendEmail(input.email, input.title, input.body);
  }

  return results;
}

async function sendSms(salonId: string | null, to: string, text: string): Promise<string> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const sender = process.env.KAVENEGAR_SENDER || "";

  // No credentials -> log as SKIPPED so admin sees it was intended but not sent
  if (!apiKey) {
    await logSms(salonId, to, text, "SKIPPED", 0);
    return "skipped";
  }

  try {
    const res = await fetch(
      `https://api.kavenegar.com/v1/${apiKey}/sms/send.json?receptor=${encodeURIComponent(
        to
      )}&sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    const ok = data.return?.status === 200;
    await logSms(salonId, to, text, ok ? "SENT" : "FAILED", ok ? SMS_COST : 0);

    // Deduct credit from the salon if it was sent
    if (ok && salonId) {
      try {
        await prisma.salon.update({
          where: { id: salonId },
          data: { smsCredit: { decrement: SMS_COST } },
        });
      } catch {}
    }
    return ok ? "sent" : "failed";
  } catch (e) {
    await logSms(salonId, to, text, "FAILED", 0);
    console.error("notify:sms failed", e);
    return "failed";
  }
}

async function logSms(salonId: string | null, to: string, message: string, status: string, cost: number) {
  try {
    await prisma.smsLog.create({ data: { salonId, to, message, status, cost } });
  } catch (e) {
    console.error("notify:smsLog failed", e);
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  const host = process.env.SMTP_HOST;
  if (!host) return "skipped";
  try {
    // Lazy import nodemailer only if SMTP configured (keeps it optional)
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) return "skipped";
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "salon@local",
      to,
      subject,
      text: body,
    });
    return "sent";
  } catch (e) {
    console.error("notify:email failed", e);
    return "failed";
  }
}
