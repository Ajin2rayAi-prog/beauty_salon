import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = session.user as any;
  const salonId = user.salonId ?? undefined;

  await prisma.notification.updateMany({
    where: {
      read: false,
      OR: [{ userId: user.id }, ...(salonId ? [{ userId: null, salonId }] : [])],
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
