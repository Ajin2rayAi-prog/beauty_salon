import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { iranianDayIndex } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/public/slots?salonId=..&providerId=..&serviceId=..&date=YYYY-MM-DD
// Returns available HH:MM start times for that provider on that date.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");
  const providerId = searchParams.get("providerId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");

  if (!salonId || !providerId || !dateStr) {
    return NextResponse.json({ error: "پارامتر ناقص" }, { status: 400 });
  }

  const [provider, salon, service] = await Promise.all([
    prisma.provider.findUnique({ where: { id: providerId }, include: { schedules: true } }),
    prisma.salon.findUnique({ where: { id: salonId } }),
    serviceId ? prisma.service.findUnique({ where: { id: serviceId } }) : Promise.resolve(null),
  ]);
  if (!provider || !salon || !provider.active) {
    return NextResponse.json({ error: "خدمت‌دهنده پیدا نشد" }, { status: 404 });
  }

  const durationMin = service?.durationMin ?? 60;
  const day = new Date(dateStr + "T00:00:00");
  const dow = iranianDayIndex(day); // 0=Sat..6=Fri
  const sched = provider.schedules.find((s) => s.dayOfWeek === dow);

  if (!sched || sched.isOff) {
    return NextResponse.json({ slots: [], dayOff: true });
  }

  // day bounds
  const dayStart = new Date(day);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // existing (non-cancelled) appointments that day
  const booked = await prisma.appointment.findMany({
    where: {
      providerId,
      startAt: { gte: dayStart, lt: dayEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startAt: true, endAt: true },
  });

  // build candidate slots every 30 min within schedule window
  const [sh, sm] = sched.startTime.split(":").map(Number);
  const [eh, em] = sched.endTime.split(":").map(Number);
  const slots: string[] = [];
  const now = new Date();
  const isToday = dayStart.toDateString() === now.toDateString();

  let cur = new Date(day);
  cur.setHours(sh, sm, 0, 0);
  const end = new Date(day);
  end.setHours(eh, em, 0, 0);

  const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  while (cur.getTime() + durationMin * 60000 <= end.getTime()) {
    const slotStart = new Date(cur);
    const slotEnd = new Date(cur.getTime() + durationMin * 60000);
    // skip past times today
    if (!(isToday && slotStart.getTime() <= now.getTime())) {
      const overlap = booked.some((b) => slotStart < b.endAt && slotEnd > b.startAt);
      if (!overlap) slots.push(toHHMM(slotStart));
    }
    cur = new Date(cur.getTime() + 30 * 60000);
  }

  return NextResponse.json({ slots, dayOff: false, durationMin });
}
