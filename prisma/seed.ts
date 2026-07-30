/**
 * Seed — creates the PLATFORM owner (from env), plus a demo tenant + salon
 * ("سالن بانوان کیا") with 6 lines, services, 3 providers (schedule + portfolio),
 * customers, sample appointments/payments, and a waitlist entry.
 * Idempotent: re-running just re-affirms the core records.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

// Real, subject-verified sample imagery. Mirrors src/lib/images.ts (each photo
// id was downloaded and visually confirmed to match its category) — inlined
// here so the seed script has no path-alias import dependency. Provider photos
// use pravatar (real female portraits), portfolios use the verified pools.
const IMAGE_BANK: Record<string, string[]> = {
  facial: ["1570172619644-dfd03ed5d881", "1512290923902-8a9f81dc236c", "1616394584738-fc6e612e71b9", "1631730359585-38a4935cbec4"],
  nails: ["1604654894610-df63bc536371", "1610992015732-2449b76344bc", "1632345031435-8727f6897d53", "1522337660859-02fbefca4702", "1583001931096-959e9a1a6223"],
  makeup: ["1503236823255-94609f598e71", "1596462502278-27bfdc403348", "1516975080664-ed2fc6a32937"],
  haircolor: ["1595476108010-b4d1f102b1b1", "1562322140-8baeececf3df", "1560869713-7d0a29430803"],
  lashes: ["1620331311520-246422fd82f9", "1503236823255-94609f598e71"],
  brows: ["1487412720507-e7ab37603c6f", "1516975080664-ed2fc6a32937"],
};
const AVATAR_IDS = [5, 9, 12, 16, 20, 24, 25, 30, 44, 45, 47, 49];
function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h;
}
const unsplashImg = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
const avatarImg = (seed: string) =>
  `https://i.pravatar.cc/400?img=${AVATAR_IDS[seedHash("av-" + seed) % AVATAR_IDS.length]}`;
const portfolioImg = (lineSlug: string, seed: string) => {
  const pool = IMAGE_BANK[lineSlug] ?? IMAGE_BANK.facial;
  return unsplashImg(pool[seedHash(`pf-${lineSlug}-${seed}`) % pool.length], 600, 800);
};

async function main() {
  // ── PLATFORM owner ──────────────────────────────────────────────────────
  const platformEmail = process.env.PLATFORM_EMAIL || "platform@salon.local";
  const platformPw = process.env.PLATFORM_PASSWORD || "1234";
  await prisma.user.upsert({
    where: { email: platformEmail },
    update: { role: "PLATFORM" },
    create: {
      name: "مالک پلتفرم",
      email: platformEmail,
      password: await hash(platformPw),
      role: "PLATFORM",
      phone: "09120000000",
    },
  });
  console.log("✔ PLATFORM owner:", platformEmail);

  // ── Demo Tenant + License ────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant-kia" },
    update: {},
    create: { id: "demo-tenant-kia", name: "گروه زیبایی کیا", phone: "09120000001", email: "tenant@kia.local" },
  });

  await prisma.license.upsert({
    where: { id: "demo-license-kia" },
    update: {},
    create: {
      id: "demo-license-kia",
      tenantId: tenant.id,
      plan: "PRO",
      status: "ACTIVE",
      maxSalons: 3,
      maxProviders: 0,
      maxLines: 0,
      priceIrr: 0,
    },
  });

  // ── Demo Salon ────────────────────────────────────────────────────────────
  const salon = await prisma.salon.upsert({
    where: { slug: "kia" },
    update: {},
    create: {
      slug: "kia",
      tenantId: tenant.id,
      name: "سالن زیبایی بانوان کیا",
      description: "مرکز تخصصی زیبایی بانوان؛ فیشیال، مانیکور، پدیکور، میکاپ، رنگ مو، لاش و برو.",
      address: "تهران، سعادت‌آباد، بلوار دریا",
      phone: "02122000000",
      city: "تهران",
      smsCredit: 50000,
      openTime: "09:00",
      closeTime: "21:00",
    },
  });

  // ── ADMIN (salon owner) ───────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kia.local" },
    update: {},
    create: {
      name: "مدیریت کیا",
      email: "admin@kia.local",
      password: await hash("1234"),
      role: "ADMIN",
      phone: "09120000002",
      tenantId: tenant.id,
      salonId: salon.id,
    },
  });

  // ── Lines ────────────────────────────────────────────────────────────────
  const lineDefs = [
    { slug: "facial", name: "فیشیال و پاکسازی پوست", icon: "Sparkles", mode: "PERCENTAGE", pct: 30, desc: "فیشیال تخصصی، پاکسازی عمیق، ماسک و آبرسانی" },
    { slug: "nails", name: "مانیکور و پدیکور", icon: "Hand", mode: "RENT", rent: 8000000, desc: "مانیکور، پدیکور، لاک ژل، طراحی ناخن" },
    { slug: "makeup", name: "میکاپ و آرایش", icon: "Brush", mode: "PERCENTAGE", pct: 40, desc: "میکاپ عروس، مهمانی، سایه و گریم" },
    { slug: "haircolor", name: "رنگ و لایت مو", icon: "Palette", mode: "PERCENTAGE", pct: 35, desc: "رنگ مو، بالیاژ، لایت، آمبره" },
    { slug: "lashes", name: "اکستنشن مژه", icon: "Eye", mode: "RENT", rent: 6000000, desc: "اکستنشن مژه کلاسیک، والیوم، مگا" },
    { slug: "brows", name: "برو و ابرو", icon: "Feather", mode: "PERCENTAGE", pct: 30, desc: "میکروبلیدینگ، فیبروز، لیفت و لمینت ابرو" },
  ];

  const lines: Record<string, string> = {};
  for (const [i, d] of lineDefs.entries()) {
    const l = await prisma.line.upsert({
      where: { salonId_slug: { salonId: salon.id, slug: d.slug } },
      update: {},
      create: {
        salonId: salon.id,
        slug: d.slug,
        name: d.name,
        icon: d.icon,
        description: d.desc,
        pricingMode: d.mode,
        rentAmount: d.rent ?? 0,
        commissionPercent: d.pct ?? 30,
        order: i,
      },
    });
    lines[d.slug] = l.id;
  }

  // ── Services per line ────────────────────────────────────────────────────
  const serviceDefs: Array<[string, string, number, number]> = [
    // [lineSlug, name, durationMin, price(toman)]
    ["facial", "فیشیال کلاسیک", 60, 850000],
    ["facial", "پاکسازی عمیق", 75, 1100000],
    ["facial", "فیشیال VIP + ماسک طلا", 90, 1800000],
    ["nails", "مانیکور + لاک", 45, 350000],
    ["nails", "پدیکور کامل", 60, 450000],
    ["nails", "کاشت ژل ناخن", 90, 900000],
    ["makeup", "میکاپ مهمانی", 60, 1500000],
    ["makeup", "میکاپ عروس کامل", 150, 6000000],
    ["haircolor", "رنگ مو تک‌رنگ", 90, 1600000],
    ["haircolor", "بالیاژ / لایت", 180, 4500000],
    ["lashes", "اکستنشن کلاسیک", 90, 1200000],
    ["lashes", "اکستنشن والیوم", 120, 1800000],
    ["brows", "لمینت ابرو", 45, 700000],
    ["brows", "میکروبلیدینگ", 120, 3500000],
  ];
  const services: Record<string, string> = {};
  for (const [slug, name, dur, price] of serviceDefs) {
    const s = await prisma.service.create({
      data: { lineId: lines[slug], name, durationMin: dur, price },
    });
    services[`${slug}:${name}`] = s.id;
  }

  // ── Providers ────────────────────────────────────────────────────────────
  const providerDefs = [
    {
      slug: "sara", name: "سارا رضایی", email: "sara@kia.local", title: "متخصص میکاپ و رنگ مو",
      bio: "بیش از ۸ سال سابقه در میکاپ عروس و رنگ‌سازی تخصصی مو.", ig: "@sara.makeup",
      lineSlugs: ["makeup", "haircolor"], imgSeed: "sara",
    },
    {
      slug: "maryam", name: "مریم احمدی", email: "maryam@kia.local", title: "متخصص فیشیال و پوست",
      bio: "کارشناس پوست با مدرک بین‌المللی فیشیال.", ig: "@maryam.skin",
      lineSlugs: ["facial", "brows"], imgSeed: "maryam",
    },
    {
      slug: "niloufar", name: "نیلوفر کریمی", email: "niloufar@kia.local", title: "کارشناس ناخن و مژه",
      bio: "طراحی ناخن و اکستنشن مژه با متریال درجه‌یک.", ig: "@nil.nails",
      lineSlugs: ["nails", "lashes"], imgSeed: "niloufar",
    },
  ];

  const providerIds: string[] = [];
  for (const p of providerDefs) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        password: await hash("1234"),
        role: "PROVIDER",
        phone: "0912" + Math.floor(1000000 + Math.random() * 8999999),
        tenantId: tenant.id,
        salonId: salon.id,
        avatar: avatarImg(p.imgSeed),
      },
    });

    const provider = await prisma.provider.upsert({
      where: { salonId_slug: { salonId: salon.id, slug: p.slug } },
      update: {},
      create: {
        salonId: salon.id,
        userId: user.id,
        slug: p.slug,
        title: p.title,
        bio: p.bio,
        instagram: p.ig,
        photoUrl: avatarImg(p.imgSeed),
      },
    });
    providerIds.push(provider.id);

    // provider <-> lines
    for (const slug of p.lineSlugs) {
      await prisma.providerLine.upsert({
        where: { providerId_lineId: { providerId: provider.id, lineId: lines[slug] } },
        update: {},
        create: { providerId: provider.id, lineId: lines[slug] },
      });
    }

    // weekly schedule: Sat-Thu 10:00-20:00, Fri off (dayOfWeek 0=Sat..6=Fri)
    for (let dow = 0; dow <= 5; dow++) {
      await prisma.providerSchedule.create({
        data: {
          providerId: provider.id,
          dayOfWeek: dow,
          startTime: "10:00",
          endTime: "20:00",
          isOff: dow === 6,
        },
      });
    }

    // portfolio items per line
    for (const slug of p.lineSlugs) {
      for (let k = 1; k <= 3; k++) {
        await prisma.providerPortfolio.create({
          data: {
            providerId: provider.id,
            lineId: lines[slug],
            imageUrl: portfolioImg(slug, `${p.imgSeed}-${k}`),
            caption: `نمونه‌کار ${slug === "makeup" ? "میکاپ" : slug === "facial" ? "فیشیال" : slug === "nails" ? "ناخن" : slug === "lashes" ? "مژه" : slug === "brows" ? "ابرو" : "رنگ مو"}`,
          },
        });
      }
    }
  }

  // ── Customers ────────────────────────────────────────────────────────────
  const customerNames = [
    ["نگار محمدی", "09301230001"], ["الهه حسینی", "09301230002"], ["شیرین کاظمی", "09301230003"],
    ["باران رستمی", "09301230004"], ["ترانه عزیزی", "09301230005"], ["سحر نادری", "09301230006"],
  ];
  const customers: string[] = [];
  for (const [name, phone] of customerNames) {
    const c = await prisma.customer.upsert({
      where: { salonId_phone: { salonId: salon.id, phone } },
      update: {},
      create: { salonId: salon.id, name, phone },
    });
    customers.push(c.id);
  }

  // ── Sample appointments (this week) + payments ───────────────────────────
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  function slot(offsetDays: number, hour: number, min = 0) {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, min, 0, 0);
    return d;
  }

  const lineBySlug = await prisma.line.findMany({ where: { salonId: salon.id } });
  const svcByLine = await prisma.service.findMany({ where: { lineId: { in: lineBySlug.map((l) => l.id) } } });
  const pickSvc = (lineSlug: string) => {
    const line = lineBySlug.find((l) => l.slug === lineSlug)!;
    return svcByLine.find((s) => s.lineId === line.id);
  };

  const appts: Array<{
    providerIdx: number; lineSlug: string; customerIdx: number;
    offset: number; hour: number; status: string; payStatus: string; online?: boolean;
  }> = [
    { providerIdx: 0, lineSlug: "makeup", customerIdx: 0, offset: 0, hour: 11, status: "DONE", payStatus: "PAID", online: true },
    { providerIdx: 0, lineSlug: "haircolor", customerIdx: 1, offset: 0, hour: 14, status: "CONFIRMED", payStatus: "DEPOSIT" },
    { providerIdx: 1, lineSlug: "facial", customerIdx: 2, offset: 0, hour: 12, status: "DONE", payStatus: "PAID" },
    { providerIdx: 2, lineSlug: "nails", customerIdx: 3, offset: 0, hour: 16, status: "CONFIRMED", payStatus: "UNPAID" },
    { providerIdx: 2, lineSlug: "lashes", customerIdx: 4, offset: 1, hour: 11, status: "CONFIRMED", payStatus: "UNPAID" },
    { providerIdx: 1, lineSlug: "brows", customerIdx: 5, offset: 1, hour: 15, status: "PENDING", payStatus: "UNPAID" },
    { providerIdx: 0, lineSlug: "makeup", customerIdx: 3, offset: 2, hour: 10, status: "PENDING", payStatus: "UNPAID" },
    { providerIdx: 1, lineSlug: "facial", customerIdx: 4, offset: 2, hour: 13, status: "CONFIRMED", payStatus: "UNPAID" },
    { providerIdx: 2, lineSlug: "nails", customerIdx: 0, offset: -1, hour: 13, status: "DONE", payStatus: "PAID" },
    { providerIdx: 0, lineSlug: "haircolor", customerIdx: 2, offset: -1, hour: 16, status: "DONE", payStatus: "PAID", online: true },
  ];

  for (const a of appts) {
    const line = lineBySlug.find((l) => l.slug === a.lineSlug)!;
    const svc = pickSvc(a.lineSlug);
    const startAt = slot(a.offset, a.hour);
    const dur = svc?.durationMin ?? 60;
    const endAt = new Date(startAt.getTime() + dur * 60000);
    const amount = svc?.price ?? 500000;

    const appt = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        lineId: line.id,
        providerId: providerIds[a.providerIdx],
        serviceId: svc?.id,
        customerId: customers[a.customerIdx],
        startAt,
        endAt,
        status: a.status,
        payMethod: a.online ? "ONLINE" : "IN_PERSON",
        payStatus: a.payStatus,
        amount,
        deposit: a.payStatus === "DEPOSIT" ? Math.round(amount * 0.3) : 0,
      },
    });

    if (a.payStatus === "PAID") {
      const { salonShare, providerShare } = splitRevenue(amount, line.pricingMode, line.commissionPercent);
      await prisma.payment.create({
        data: {
          salonId: salon.id,
          appointmentId: appt.id,
          amount,
          method: a.online ? "ONLINE" : "IN_PERSON",
          salonShare,
          providerShare,
          refId: a.online ? `REF${Math.floor(100000 + Math.random() * 899999)}` : null,
        },
      });
    }
  }

  // ── Waitlist entry ────────────────────────────────────────────────────────
  await prisma.waitlist.create({
    data: {
      salonId: salon.id,
      lineId: lineBySlug.find((l) => l.slug === "makeup")!.id,
      providerId: providerIds[0],
      name: "مهسا فراهانی",
      phone: "09309990007",
      desiredDate: slot(2, 10),
      status: "WAITING",
    },
  });

  // ── Site settings ─────────────────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: "platformName" },
    update: {},
    create: { key: "platformName", value: "سالن‌پرو" },
  });

  console.log("✔ Seed complete: 1 tenant, 1 salon (kia),", lineDefs.length, "lines,",
    providerDefs.length, "providers,", customerNames.length, "customers,",
    appts.length, "appointments");
}

function splitRevenue(amount: number, pricingMode: string, commissionPercent: number) {
  if (pricingMode === "RENT") return { salonShare: 0, providerShare: amount };
  const salonShare = Math.round((amount * commissionPercent) / 100);
  return { salonShare, providerShare: amount - salonShare };
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
