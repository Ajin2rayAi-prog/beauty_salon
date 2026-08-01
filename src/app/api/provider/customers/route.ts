import { NextResponse } from "next/server";
import { requireRoleApi, assertFeatureApi, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Provider-facing customer dossier API. A provider may read/write the record of
 * any customer they have actually served (has ≥1 appointment with this
 * provider) — never the whole salon's book. Gated by the `customerRecords`
 * feature so it mirrors the ADMIN dossier's licensing.
 */

// Resolve the signed-in provider and confirm the customer is one of theirs.
async function ownedCustomer(userId: string, customerId: string) {
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return { provider: null, customer: null };
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, salonId: provider.salonId, appointments: { some: { providerId: provider.id } } },
  });
  return { provider, customer };
}

// PUT /api/provider/customers  — update the shared record fields.
export async function PUT(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { customerId, hairFormula, allergies, skinNotes, notes, birthday } = body ?? {};
  if (!customerId) return NextResponse.json({ error: "شناسهٔ مشتری لازم است" }, { status: 400 });

  const { provider, customer } = await ownedCustomer(user.id, customerId);
  if (!provider || !customer) return NextResponse.json({ error: "این مشتری در فهرست شما نیست" }, { status: 404 });

  const feat = await assertFeatureApi(provider.salonId, "customerRecords");
  if (!feat.ok) return feat.response;

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      hairFormula: hairFormula ?? null,
      allergies: allergies ?? null,
      skinNotes: skinNotes ?? null,
      notes: notes ?? null,
      birthday: birthday ? new Date(birthday) : null,
    },
  });
  return NextResponse.json({ ok: true, customer: updated });
}

// POST /api/provider/customers  — append a per-visit note.
export async function POST(req: Request) {
  const { user, response } = await requireRoleApi([ROLES.PROVIDER]);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const { customerId, appointmentId, text } = body ?? {};
  if (!customerId || !text?.trim()) return NextResponse.json({ error: "متن یادداشت لازم است" }, { status: 400 });

  const { provider, customer } = await ownedCustomer(user.id, customerId);
  if (!provider || !customer) return NextResponse.json({ error: "این مشتری در فهرست شما نیست" }, { status: 404 });

  const feat = await assertFeatureApi(provider.salonId, "customerRecords");
  if (!feat.ok) return feat.response;

  const note = await prisma.visitNote.create({
    data: {
      customerId: customer.id,
      appointmentId: appointmentId || null,
      providerId: provider.id,
      authorName: user.name || "خدمت‌دهنده",
      text: text.trim(),
    },
  });
  return NextResponse.json({ ok: true, note });
}
