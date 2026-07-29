import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// slugify: keep latin letters/digits, collapse the rest to single dashes
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Onboard a new client: Tenant + owner ADMIN user + first Salon + default License.
export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PLATFORM]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const {
    tenantName, phone, email,
    adminName, adminEmail, adminPassword,
    salonName, salonSlug, city,
    plan, priceIrr, maxSalons,
  } = body as {
    tenantName?: string; phone?: string; email?: string;
    adminName?: string; adminEmail?: string; adminPassword?: string;
    salonName?: string; salonSlug?: string; city?: string;
    plan?: string; priceIrr?: number; maxSalons?: number;
  };

  if (!tenantName || !adminName || !adminEmail || !salonName) {
    return NextResponse.json({ error: "نام کارفرما، نام و ایمیل مدیر، و نام سالن الزامی است" }, { status: 400 });
  }

  const slug = slugify(salonSlug || salonName);
  if (!slug) return NextResponse.json({ error: "اسلاگ سالن نامعتبر است (از حروف انگلیسی استفاده کنید)" }, { status: 400 });

  const [emailTaken, slugTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: adminEmail } }),
    prisma.salon.findUnique({ where: { slug } }),
  ]);
  if (emailTaken) return NextResponse.json({ error: "این ایمیل مدیر قبلاً ثبت شده" }, { status: 409 });
  if (slugTaken) return NextResponse.json({ error: "این اسلاگ سالن تکراری است" }, { status: 409 });

  const hash = await bcrypt.hash(adminPassword || "Salon@123", 10);

  const created = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: tenantName, phone: phone || null, email: email || null },
    });

    const salon = await tx.salon.create({
      data: {
        tenantId: tenant.id,
        slug,
        name: salonName,
        city: city || null,
      },
    });

    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hash,
        role: ROLES.ADMIN,
        tenantId: tenant.id,
        salonId: salon.id,
      },
    });

    const license = await tx.license.create({
      data: {
        tenantId: tenant.id,
        plan: plan || "PRO",
        status: "ACTIVE",
        priceIrr: Number(priceIrr) || 0,
        maxSalons: Number(maxSalons) || 1,
      },
    });

    return { tenant, salon, admin, license };
  });

  return NextResponse.json({
    ok: true,
    tenant: {
      id: created.tenant.id,
      name: created.tenant.name,
      phone: created.tenant.phone,
      email: created.tenant.email,
      createdAt: created.tenant.createdAt,
      _count: { salons: 1, users: 1 },
      salons: [{ id: created.salon.id, name: created.salon.name, slug: created.salon.slug, active: created.salon.active }],
      licenses: [{ id: created.license.id, plan: created.license.plan, status: created.license.status, priceIrr: created.license.priceIrr }],
    },
  });
}
