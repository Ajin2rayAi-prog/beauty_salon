/**
 * Central image bank — REAL, subject-verified beauty/salon imagery.
 *
 * Every photo ID below was downloaded and visually confirmed to match its
 * category (a nails photo really shows nails, a facial photo really shows a
 * facial, etc.). We deliberately do NOT use keyword services like loremflickr:
 * they return loosely-tagged, often irrelevant photos (a cat for the nails
 * line) and were returning HTTP 500. Instead we hard-map each line to a small
 * pool of hand-checked Unsplash CDN photo IDs, and use pravatar for provider
 * portraits. Fully deterministic, no API key, no bundled binaries.
 *
 * Safe to import from both server and client components (no server-only deps).
 */

/** Build an Unsplash CDN url from a bare photo id. */
function unsplash(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

/** Small stable hash so a string seed maps to a fixed index. */
function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h;
}

/**
 * Verified photo pools per line slug. Each id was viewed and confirmed on its
 * subject. lashes/brows use beauty face portraits (eyes + brows clearly in
 * frame) plus an eye-makeup close-up, since reliable macro shots weren't
 * available — still on-topic beauty imagery, never random.
 */
const IMAGE_BANK: Record<string, string[]> = {
  facial: [
    "1570172619644-dfd03ed5d881", // clay mask application
    "1512290923902-8a9f81dc236c", // facial treatment
    "1616394584738-fc6e612e71b9", // cream mask + headband
    "1631730359585-38a4935cbec4", // serum / skincare bottles
  ],
  nails: [
    "1604654894610-df63bc536371", // dark tortoiseshell nail art
    "1610992015732-2449b76344bc", // natural pink manicure
    "1632345031435-8727f6897d53", // manicure in progress
    "1522337660859-02fbefca4702", // pink glitter polish
    "1583001931096-959e9a1a6223", // salon manicure, red polish
  ],
  makeup: [
    "1503236823255-94609f598e71", // eyeshadow pot + brush
    "1596462502278-27bfdc403348", // makeup flatlay (brushes, lipstick)
    "1516975080664-ed2fc6a32937", // makeup brushes in a holder
  ],
  haircolor: [
    "1595476108010-b4d1f102b1b1", // hair wash at salon basin
    "1562322140-8baeececf3df", // blow-dry styling
    "1560869713-7d0a29430803", // curling / waves styling
  ],
  lashes: [
    "1620331311520-246422fd82f9", // beauty face portrait (eyes in frame)
    "1503236823255-94609f598e71", // eye-makeup close-up
  ],
  brows: [
    "1487412720507-e7ab37603c6f", // beauty face portrait (brows in frame)
    "1516975080664-ed2fc6a32937", // brow / makeup tools
  ],
};

const FALLBACK = IMAGE_BANK.facial;

/** Deterministically pick one id from a line's pool. */
function pickId(slug: string, seed: number): string {
  const pool = IMAGE_BANK[slug] ?? FALLBACK;
  return pool[Math.abs(seed) % pool.length];
}

/**
 * Kept for backward compatibility (callers pass Persian-neutral slugs). No
 * longer drives image selection — the verified IMAGE_BANK above does.
 */
export const LINE_KEYWORDS: Record<string, string> = {
  facial: "facial,spa,skincare",
  nails: "manicure,nails",
  makeup: "makeup,cosmetics",
  haircolor: "hairsalon,haircolor",
  lashes: "eyelash,eye",
  brows: "eyebrow,makeup",
};

/** Cover image for a line card / line page. `lock` varies the pick per card. */
export function lineImage(slug: string, lock = 11, w = 600, h = 800): string {
  return unsplash(pickId(slug, lock), w, h);
}

/**
 * Round avatar for a provider — real female portraits (pravatar), deterministic
 * from the provider slug. This is a women's salon, so the pool is female only.
 */
const AVATAR_IDS = [5, 9, 12, 16, 20, 24, 25, 30, 44, 45, 47, 49];
export function providerAvatar(seed: string, size = 400): string {
  const n = AVATAR_IDS[seedHash("av-" + seed) % AVATAR_IDS.length];
  return `https://i.pravatar.cc/${size}?img=${n}`;
}

/** Portfolio work image, deterministic from (line + seed). */
export function portfolioImage(lineSlug: string, seed: string, w = 600, h = 800): string {
  return unsplash(pickId(lineSlug, seedHash(`pf-${lineSlug}-${seed}`)), w, h);
}

/** Hand-picked hero collage — order matches the landing page layout. */
export const HERO_IMAGES: string[] = [
  unsplash("1620331311520-246422fd82f9", 800, 1000), // [0] beauty portrait (tall)
  unsplash("1570172619644-dfd03ed5d881", 800, 600), //  [1] facial (wide)
  unsplash("1596462502278-27bfdc403348", 800, 1000), // [2] makeup (tall)
  unsplash("1610992015732-2449b76344bc", 800, 600), //  [3] nails (wide)
];

/**
 * Curated gallery pool for the provider portfolio picker — real beauty photos
 * grouped by category so a provider can pick instead of pasting a URL.
 */
export type GalleryImage = { url: string; caption: string; category: string; lineSlug: string };

function galleryFor(lineSlug: string, category: string, caption: string): GalleryImage[] {
  const pool = IMAGE_BANK[lineSlug] ?? FALLBACK;
  return pool.map((id) => ({ url: unsplash(id, 600, 800), caption, category, lineSlug }));
}

export const GALLERY: GalleryImage[] = [
  ...galleryFor("makeup", "میکاپ و آرایش", "میکاپ حرفه‌ای"),
  ...galleryFor("nails", "ناخن", "طراحی و کاشت ناخن"),
  ...galleryFor("facial", "فیشیال و پوست", "پاکسازی و فیشیال"),
  ...galleryFor("haircolor", "رنگ مو", "رنگ و لایت مو"),
  ...galleryFor("lashes", "مژه", "اکستنشن مژه"),
  ...galleryFor("brows", "ابرو", "طراحی و لمینت ابرو"),
];
