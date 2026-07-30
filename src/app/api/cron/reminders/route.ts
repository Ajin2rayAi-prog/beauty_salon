import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getSalonEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/reminders
 * Sends a one-time SMS reminder for appointments starting within the next
 * REMINDER_WINDOW_HOURS. Idempotent via Appointment.reminderSentAt.
 * Protect with CRON_SECRET (header `x-cron-secret` or `?secret=`) in production.
 * Call it from Railway cron / an external scheduler every ~15-30 minutes.
 */

const WINDOW_HOURS = Number(process.env.REMINDER_WINDOW_HOURS ?? 24);

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const { searchParams } = new URL(req.url);
    const given = req.headers.get("x-cron-secret") ?? searchParams.get("secret");
    if (given !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const until = new Date(now.getTime() + WINDOW_HOURS * 3600_000);

  const due = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSentAt: null,
      startAt: { gte: now, lte: until },
    },
    include: { line: true, customer: true, salon: { select: { id: true, name: true } } },
    take: 200,
  });

  let sent = 0;
  let skipped = 0;
  const entCache = new Map<string, boolean>();

  for (const appt of due) {
    if (!appt.customer.phone) { skipped++; continue; }

    let remindersOn = entCache.get(appt.salonId);
    if (remindersOn === undefined) {
      const ent = await getSalonEntitlements(appt.salonId);
      remindersOn = !!ent.features.reminders;
      entCache.set(appt.salonId, remindersOn);
    }
    if (!remindersOn) { skipped++; continue; }

    const when = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(appt.startAt);
    await notify({
      salonId: appt.salonId,
      phone: appt.customer.phone,
      title: "یادآوری نوبت",
      body: `${appt.salon.name}: یادآوری نوبت شما (${appt.line.name}) در ${when}.`,
    });
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: new Date() } });
    sent++;
  }

  return NextResponse.json({ ok: true, windowHours: WINDOW_HOURS, candidates: due.length, sent, skipped });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
