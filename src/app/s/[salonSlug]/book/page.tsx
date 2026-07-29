import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookingClient } from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { salonSlug: string };
  searchParams: { line?: string; service?: string; provider?: string };
}) {
  const session = await getServerSession(authOptions);
  const salon = await prisma.salon.findUnique({
    where: { slug: params.salonSlug, active: true },
    include: {
      lines: { where: { active: true }, orderBy: { order: "asc" }, include: { services: { where: { active: true }, orderBy: { price: "asc" } } } },
      providers: {
        where: { active: true },
        include: { user: { select: { name: true } }, lines: { include: { line: true } } },
      },
    },
  });
  if (!salon) notFound();

  const me = session?.user ? await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { name: true, phone: true } }) : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold sm:text-3xl">رزرو نوبت</h1>
          <p className="mt-1 text-white/50">{salon.name}</p>
        </div>

        <BookingClient
          salonId={salon.id}
          initialLine={searchParams.line ?? ""}
          initialService={searchParams.service ?? ""}
          initialProvider={searchParams.provider ?? ""}
          meName={me?.name ?? ""}
          mePhone={me?.phone ?? ""}
          lines={JSON.parse(JSON.stringify(salon.lines))}
          providers={JSON.parse(JSON.stringify(salon.providers))}
        />
      </main>
    </div>
  );
}
