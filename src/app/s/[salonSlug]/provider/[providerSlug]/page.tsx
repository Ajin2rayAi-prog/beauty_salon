import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { CalendarHeart, ArrowRight, Instagram, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({
  params,
}: {
  params: { salonSlug: string; providerSlug: string };
}) {
  const salon = await prisma.salon.findUnique({ where: { slug: params.salonSlug, active: true } });
  if (!salon) notFound();

  const provider = await prisma.provider.findUnique({
    where: { salonId_slug: { salonId: salon.id, slug: params.providerSlug } },
    include: {
      user: { select: { name: true } },
      lines: { include: { line: true } },
      portfolios: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!provider || !provider.active) notFound();

  // Group portfolios by line (key requirement: نمونه‌کار به‌تفکیک هر لاین)
  const byLine = new Map<string, { lineName: string; lineSlug: string; items: typeof provider.portfolios }>();
  const general: typeof provider.portfolios = [];

  for (const pf of provider.portfolios) {
    if (pf.lineId) {
      const pl = provider.lines.find((l) => l.lineId === pf.lineId);
      const key = pf.lineId;
      if (!byLine.has(key)) {
        byLine.set(key, { lineName: pl?.line.name ?? "لاین", lineSlug: pl?.line.slug ?? "", items: [] });
      }
      byLine.get(key)!.items.push(pf);
    } else {
      general.push(pf);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/"><Wordmark /></Link>
          <Link href={`/s/${salon.slug}`} className="btn-ghost px-3 py-2 text-sm"><ArrowRight size={15} /> بازگشت</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {/* Profile header */}
        <div className="card relative mt-6 overflow-hidden p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-plum-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-2 border-rose-400/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={provider.photoUrl ?? `https://picsum.photos/seed/${provider.slug}/300/300`} alt={provider.title ?? provider.slug} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{provider.title ?? "خدمت‌دهنده"}</h1>
              <p className="mt-1 text-white/50">{provider.user?.name}</p>
              {provider.bio && <p className="mt-3 max-w-xl leading-7 text-white/60">{provider.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {provider.lines.map((pl) => (
                  <Link key={pl.lineId} href={`/s/${salon.slug}/line/${pl.line.slug}`} className="badge text-xs hover:border-rose-400/40">{pl.line.name}</Link>
                ))}
              </div>
              {provider.instagram && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-plum-300"><Instagram size={15} /> {provider.instagram}</p>
              )}
            </div>
            <Link href={`/s/${salon.slug}/book?provider=${provider.slug}`} className="btn-rose px-5 py-3">
              <CalendarHeart size={18} /> رزرو نوبت
            </Link>
          </div>
        </div>

        {/* Portfolio per line */}
        {byLine.size === 0 && general.length === 0 ? (
          <div className="card mt-8 p-12 text-center">
            <Camera size={32} className="mx-auto text-white/30" />
            <p className="mt-3 text-white/45">هنوز نمونه‌کاری ثبت نشده است.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {[...byLine.entries()].map(([lineId, group]) => (
              <section key={lineId}>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-gradient">{group.lineName}</h2>
                  <span className="badge text-[11px]">{group.items.length} نمونه‌کار</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((pf) => (
                    <figure key={pf.id} className="card group overflow-hidden">
                      <div className="aspect-[3/4] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      {pf.caption && (
                        <figcaption className="p-2.5 text-xs leading-5 text-white/55">{pf.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            ))}

            {general.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-extrabold text-gradient">نمونه‌کارهای عمومی</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {general.map((pf) => (
                    <figure key={pf.id} className="card group overflow-hidden">
                      <div className="aspect-[3/4] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pf.imageUrl} alt={pf.caption ?? ""} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      {pf.caption && <figcaption className="p-2.5 text-xs leading-5 text-white/55">{pf.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
