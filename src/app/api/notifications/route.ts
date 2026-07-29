import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lists notifications visible to the current user (own user-scoped + their salon's).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = session.user as any;
  const userId = user.id;
  const salonId = user.salonId ?? undefined;

  const items = await prisma.notification.findMany({
    where: {
      OR: [{ userId }, ...(salonId ? [{ userId: null, salonId }] : [])],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unread = await prisma.notification.count({
    where: {
      read: false,
      OR: [{ userId }, ...(salonId ? [{ userId: null, salonId }] : [])],
    },
  });

  return NextResponse.json({
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  });
}
