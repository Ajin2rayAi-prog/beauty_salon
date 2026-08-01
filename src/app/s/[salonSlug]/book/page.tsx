import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, CalendarHeart } from "lucide-react";
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
  // The path segment may be a slug OR a subdomain label (middleware rewrites
  // `{sub}.domain` → `/s/{sub}`), so match either — same as the salon home page.
  const salon = await prisma.salon.findFirst({
    where: { active: true, OR: [{ slug: params.salonSlug }, { subdomain: params.salonSlug }] },
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
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0f0716]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت</Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 pb-20 pt-10">
        <div className="blob animate-float -right-10 top-4 h-56 w-56 bg-rose-500/20" />
        <div className="relative mb-8 text-center">
          <span className="eyebrow"><CalendarHeart size={14} /> رزرو آنلاین</span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">رزرو <span className="text-gradient">نوبت</span></h1>
          <p className="mt-2 text-white/50">{salon.name}</p>
        </div>

        <BookingClient
          salonId={salon.id}
          initialLine={searchParams.line ?? ""}
          initialService={searchParams.service ?? ""}
          initialProvider={searchParams.provider ?? ""}
          meName={me?.name ?? ""}
          mePhone={me?.phone ?? ""}
          loggedIn={!!me}
          lines={JSON.parse(JSON.stringify(salon.lines))}
          providers={JSON.parse(JSON.stringify(salon.providers))}
        />
      </main>
    </div>
  );
}
