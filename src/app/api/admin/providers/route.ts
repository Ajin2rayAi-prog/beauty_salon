import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { providerAvatar } from "@/lib/images";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.ADMIN]);
  if (response) return response;
  const salonId = user.salonId!;
  const tenantId = user.tenantId!;

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, password, title, slug, lineIds } = body as {
    name?: string; email?: string; phone?: string; password?: string;
    title?: string; slug?: string; lineIds?: string[];
  };

  if (!name || !email || !slug) {
    return NextResponse.json({ error: "نام، ایمیل و اسلاگ الزامی است" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده" }, { status: 409 });

  const existingProvider = await prisma.provider.findUnique({ where: { salonId_slug: { salonId, slug } } });
  if (existingProvider) return NextResponse.json({ error: "این اسلاگ در سالن تکراری است" }, { status: 409 });

  const hash = await bcrypt.hash(password || "1234", 10);

  const userRow = await prisma.user.create({
    data: { name, email, phone, password: hash, role: "PROVIDER", tenantId, salonId },
  });

  const provider = await prisma.provider.create({
    data: {
      salonId,
      userId: userRow.id,
      slug,
      title: title || null,
      photoUrl: providerAvatar(slug),
    },
  });

  if (Array.isArray(lineIds) && lineIds.length) {
    await prisma.providerLine.createMany({
      data: lineIds.map((lineId) => ({ providerId: provider.id, lineId })),
    });
  }

  const full = await prisma.provider.findUnique({
    where: { id: provider.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      lines: { include: { line: { select: { id: true, name: true } } } },
      _count: { select: { appointments: true, portfolios: true } },
    },
  });

  return NextResponse.json({ ok: true, provider: full });
}
