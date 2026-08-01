import { requireRole, requireFeature, ROLES } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProviderCustomerDetailClient } from "./ProviderCustomerDetailClient";

export const dynamic = "force-dynamic";

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function ProviderCustomerPage({ params }: { params: { id: string } }) {
  const user = await requireRole([ROLES.PROVIDER]);
  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) throw new Error("پروفایل پیدا نشد");
  await requireFeature(provider.salonId, "customerRecords", "/provider");

  // The customer must be one this provider has served.
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, salonId: provider.salonId, appointments: { some: { providerId: provider.id } } },
    include: {
      appointments: {
        where: { providerId: provider.id },
        orderBy: { startAt: "desc" },
        take: 30,
        include: { line: { select: { name: true } }, service: { select: { name: true } } },
      },
      visitNotes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const initial = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    hairFormula: customer.hairFormula ?? "",
    allergies: customer.allergies ?? "",
    skinNotes: customer.skinNotes ?? "",
    notes: customer.notes ?? "",
    birthday: isoDate(customer.birthday),
  };

  const history = customer.appointments.map((a) => ({
    id: a.id,
    startAt: a.startAt.toISOString(),
    status: a.status,
    amount: a.amount,
    line: a.line.name,
    service: a.service?.name ?? "",
    notes: a.notes ?? "",
  }));

  const notes = customer.visitNotes.map((n) => ({
    id: n.id,
    text: n.text,
    authorName: n.authorName,
    createdAt: n.createdAt.toISOString(),
    mine: n.providerId === provider.id,
  }));

  return (
    <div className="space-y-6">
      <Link href="/provider/customers" className="btn-ghost inline-flex px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت به مشتریان</Link>
      <ProviderCustomerDetailClient initial={initial} history={history} notes={notes} />
    </div>
  );
}
