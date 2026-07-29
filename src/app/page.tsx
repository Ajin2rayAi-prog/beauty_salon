import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Logo";
import { CalendarHeart, Sparkles, Users, ShieldCheck, Clock, ArrowLeft, Instagram } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSalon() {
  // Public landing shows the first active salon (demo). In production, resolved by domain/slug.
  return prisma.salon.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      lines: { where: { active: true }, orderBy: { order: "asc" } },
      providers: {
        where: { active: true },
        include: { lines: { include: { line: true } } },
      },
    },
  });
}

export default async function Home() {
  const salon = await getSalon();

  if (!salon) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <Wordmark className="justify-center" />
          <p className="mt-6 text-white/60">هنوز سالنی ثبت نشده است. مدیر پلتفرم وارد شود و سالن بسازد.</p>
          <Link href="/login" className="btn-rose mt-6 inline-flex">ورود مدیریت پلتفرم</Link>
        </div>
      </div>
    );
  }

  const lineIcons: Record<string, string> = {
    Sparkles: "✨", Hand: "💅", Brush: "💄", Palette: "🎨", Eye: "👁️", Feather: "🪶",
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#160a1c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/"><Wordmark /></Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <a href="#lines" className="nav-link">لاین‌ها</a>
            <a href="#providers" className="nav-link">خدمت‌دهنده‌ها</a>
            <a href="#contact" className="nav-link">تماس</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost px-3 py-2 text-sm">ورود</Link>
            <Link href={`/s/${salon.slug}`} className="btn-rose px-4 py-2 text-sm">
              <CalendarHeart size={16} /> رزرو نوبت
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,rgba(236,72,137,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-fade-up">
              <span className="badge mb-4 border-rose-400/30 bg-rose-500/10 text-rose-200">
                <Sparkles size={13} /> {salon.name}
              </span>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                زیبایی‌ات را آنلاین <span className="text-gradient">رزرو کن</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/60">
                {salon.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/s/${salon.slug}`} className="btn-rose px-6 py-3">
                  <CalendarHeart size={18} /> همین حالا رزرو کن
                </Link>
                <a href="#lines" className="btn-outline px-6 py-3">مشاهده لاین‌ها</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/50">
                <span className="flex items-center gap-2"><Clock size={16} className="text-rose-300" /> {salon.openTime} تا {salon.closeTime}</span>
                <span className="flex items-center gap-2"><Users size={16} className="text-plum-300" /> {salon.providers.length} خدمت‌دهنده</span>
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /> رزرو آنلاین امن</span>
              </div>
            </div>

            <div className="relative hidden animate-fade-up lg:block">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-rose-500/20 to-plum-500/20 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://picsum.photos/seed/salonpro-hero/720/720"
                alt="سالن زیبایی بانوان"
                className="relative aspect-square w-full rounded-[2rem] border border-white/10 object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lines */}
      <section id="lines" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold sm:text-3xl">لاین‌های زیبایی</h2>
        <p className="mt-2 text-white/50">هر لاین خدمت‌دهنده‌ها و خدمات مخصوص به خود را دارد.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {salon.lines.map((line) => (
            <Link
              key={line.id}
              href={`/s/${salon.slug}/line/${line.slug}`}
              className="card group p-6 transition hover:-translate-y-1 hover:border-rose-400/40"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-gradient text-2xl">
                {lineIcons[line.icon ?? ""] ?? "💫"}
              </div>
              <h3 className="mt-4 text-lg font-bold">{line.name}</h3>
              <p className="mt-1.5 text-sm leading-6 text-white/55">{line.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rose-300">
                مشاهده و رزرو <ArrowLeft size={15} className="transition group-hover:-translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold sm:text-3xl">خدمت‌دهنده‌های ما</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {salon.providers.map((p) => (
            <Link
              key={p.id}
              href={`/s/${salon.slug}/provider/${p.slug}`}
              className="card group flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:border-plum-400/40"
            >
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-rose-400/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl ?? `https://picsum.photos/seed/${p.slug}/200/200`} alt={p.title ?? p.slug} className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{p.title ?? "خدمت‌دهنده"}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">{p.bio}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {p.lines.map((pl) => (
                  <span key={pl.lineId} className="badge text-[11px]">{pl.line.name}</span>
                ))}
              </div>
              {p.instagram && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-plum-300">
                  <Instagram size={13} /> {p.instagram}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">با ما در تماس باشید</h2>
              <p className="mt-3 text-white/60">{salon.address}</p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-3"><Clock size={16} className="text-rose-300" /> ساعت کار: {salon.openTime} تا {salon.closeTime}</p>
                <p className="flex items-center gap-3"><ShieldCheck size={16} className="text-plum-300" /> {salon.phone}</p>
                <p className="flex items-center gap-3"><Users size={16} className="text-emerald-300" /> {salon.city}</p>
              </div>
            </div>
            <div className="flex flex-col items-start justify-center gap-4">
              <p className="text-lg text-white/70">برای رزرو سریع و یادآوری پیامکی، آنلاین نوبت بگیر.</p>
              <Link href={`/s/${salon.slug}`} className="btn-rose px-6 py-3">
                <CalendarHeart size={18} /> رزرو آنلاین نوبت
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 text-center text-sm text-white/40">
        <Wordmark className="justify-center" />
        <p className="mt-2">© {new Date().getFullYear()} — ساخته‌شده با <span className="text-rose-300">سالن‌پرو</span></p>
      </footer>
    </div>
  );
}
