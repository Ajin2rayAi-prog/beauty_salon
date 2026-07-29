import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { CalendarHeart, Clock, Instagram, ArrowLeft, LogIn } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SalonPage({ params }: { params: { salonSlug: string } }) {
  const session = await getServerSession(authOptions);
  const salon = await prisma.salon.findUnique({
    where: { slug: params.salonSlug, active: true },
    include: {
      lines: { where: { active: true }, orderBy: { order: "asc" } },
      providers: {
        where: { active: true },
        include: {
          user: { select: { name: true } },
          lines: { include: { line: true } },
        },
      },
    },
  });
  if (!salon) notFound();

  const lineIcons: Record<string, string> = {
    Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/dashboard" className="btn-outline px-3 py-2 text-sm">داشبورد من</Link>
            ) : (
              <Link href="/login" className="btn-ghost px-3 py-2 text-sm"><LogIn size={15} /> ورود</Link>
            )}
            <a href="#lines" className="btn-rose px-4 py-2 text-sm"><CalendarHeart size={16} /> رزرو نوبت</a>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(168,85,247,0.22),transparent_65%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{salon.name}</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/60">{salon.description}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-5 text-sm text-white/50">
            <span className="flex items-center gap-2"><Clock size={16} className="text-rose-300" /> {salon.openTime} تا {salon.closeTime}</span>
            {salon.address && <span className="text-white/40">📍 {salon.address}</span>}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {/* Lines */}
        <section id="lines" className="scroll-mt-20 py-12">
          <h2 className="text-xl font-extrabold sm:text-2xl">لاین‌های خدمات</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salon.lines.map((line) => (
              <Link key={line.id} href={`/s/${salon.slug}/line/${line.slug}`} className="card group p-5 transition hover:-translate-y-1 hover:border-rose-400/40">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-gradient text-xl">
                  {lineIcons[line.icon ?? ""] ?? "💫"}
                </div>
                <h3 className="mt-3 font-bold">{line.name}</h3>
                <p className="mt-1 text-xs leading-5 text-white/50 line-clamp-2">{line.description}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-300">
                  رزرو و مشاهده <ArrowLeft size={13} className="transition group-hover:-translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Providers */}
        <section className="py-12">
          <h2 className="text-xl font-extrabold sm:text-2xl">خدمت‌دهنده‌ها</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salon.providers.map((p) => (
              <Link key={p.id} href={`/s/${salon.slug}/provider/${p.slug}`} className="card group flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:border-plum-400/40">
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-rose-400/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl ?? `https://picsum.photos/seed/${p.slug}/200/200`} alt={p.title ?? p.slug} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 font-bold">{p.title ?? "خدمت‌دهنده"}</h3>
                <p className="mt-1 text-xs text-white/45">{p.user?.name}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{p.bio}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {p.lines.map((pl) => (
                    <span key={pl.lineId} className="badge text-[10px]">{pl.line.name}</span>
                  ))}
                </div>
                {p.instagram && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-plum-300"><Instagram size={12} /> {p.instagram}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-white/40">
        <p>رزرو آنلاین با <span className="text-rose-300">سالن‌پرو</span></p>
      </footer>
    </div>
  );
}
