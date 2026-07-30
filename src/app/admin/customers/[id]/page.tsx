import { requireRole, requireFeature, ROLES, activeSalonId } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CustomerDetailClient } from "./CustomerDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole([ROLES.ADMIN]);
  const salonId = await activeSalonId(user);
  await requireFeature(salonId, "customerRecords");

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, salonId },
    include: {
      appointments: {
        orderBy: { startAt: "desc" },
        take: 30,
        include: {
          line: { select: { name: true } },
          service: { select: { name: true } },
          provider: { select: { title: true } },
        },
      },
    },
  });
  if (!customer) notFound();

  const history = customer.appointments.map((a) => ({
    id: a.id,
    startAt: a.startAt.toISOString(),
    status: a.status,
    amount: a.amount,
    line: a.line?.name ?? "",
    service: a.service?.name ?? "",
    provider: a.provider?.title ?? "",
  }));

  return (
    <div className="relative space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white">
        <ArrowRight size={15} /> بازگشت به لیست مشتریان
      </Link>
      <CustomerDetailClient
        initial={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes ?? "",
          hairFormula: customer.hairFormula ?? "",
          allergies: customer.allergies ?? "",
          skinNotes: customer.skinNotes ?? "",
          birthday: customer.birthday ? customer.birthday.toISOString().slice(0, 10) : "",
          loyaltyPoints: customer.loyaltyPoints,
          loyaltyTier: customer.loyaltyTier,
        }}
        history={history}
      />
    </div>
  );
}
