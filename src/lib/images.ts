/**
 * Central image bank — REAL beauty/salon sample imagery (never nature/random).
 *
 * We use loremflickr's keyword endpoint, which returns real, topic-relevant
 * photos and is fully deterministic via the `lock` seed (same lock => same
 * photo). This keeps demo data looking like an actual salon site without
 * needing an API key or bundling binary assets.
 *
 * Safe to import from both server and client components (no server-only deps).
 */

/** Deterministic keyword photo. `lock` fixes the exact image. */
export function kwImage(keywords: string, lock: number, w = 600, h = 800): string {
  const kw = encodeURIComponent(keywords);
  return `https://loremflickr.com/${w}/${h}/${kw}/?lock=${lock}`;
}

/** Small stable hash so a string seed maps to a fixed image. */
function seedLock(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return (h % 900) + 1;
}

/** Beauty keywords per salon line (falls back to a generic salon term). */
export const LINE_KEYWORDS: Record<string, string> = {
  facial: "facial,spa,skincare",
  nails: "manicure,nails",
  makeup: "makeup,cosmetics",
  haircolor: "hairsalon,haircolor",
  lashes: "eyelash,eye",
  brows: "eyebrow,makeup",
};

/** Cover image for a line card / line page. */
export function lineImage(slug: string, lock = 11, w = 600, h = 800): string {
  return kwImage(LINE_KEYWORDS[slug] ?? "salon,beauty", lock, w, h);
}

/** Round avatar for a provider, deterministic from their slug. */
export function providerAvatar(seed: string, size = 400): string {
  return kwImage("woman,portrait,beauty", seedLock("av-" + seed), size, size);
}

/** Portfolio work image, deterministic from (line + seed). */
export function portfolioImage(lineSlug: string, seed: string, w = 600, h = 800): string {
  const kw = LINE_KEYWORDS[lineSlug] ?? "salon,beauty";
  return kwImage(kw, seedLock(`pf-${lineSlug}-${seed}`), w, h);
}

/** Hand-picked hero collage (real, high-quality Unsplash CDN — verified 200). */
export const HERO_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&auto=format&fit=crop",
  kwImage("makeup,cosmetics", 21, 800, 1000),
  kwImage("manicure,nails", 34, 800, 1000),
];

/**
 * Curated gallery pool for the provider portfolio picker — real beauty photos
 * grouped by category so a provider can pick instead of pasting a URL.
 */
export type GalleryImage = { url: string; caption: string; category: string; lineSlug: string };

function galleryFor(lineSlug: string, category: string, caption: string, count: number): GalleryImage[] {
  const kw = LINE_KEYWORDS[lineSlug] ?? "salon,beauty";
  return Array.from({ length: count }, (_, i) => ({
    url: kwImage(kw, 100 + i + lineSlug.length * 40, 600, 800),
    caption,
    category,
    lineSlug,
  }));
}

export const GALLERY: GalleryImage[] = [
  ...galleryFor("makeup", "میکاپ و آرایش", "میکاپ حرفه‌ای", 6),
  ...galleryFor("nails", "ناخن", "طراحی و کاشت ناخن", 6),
  ...galleryFor("facial", "فیشیال و پوست", "پاکسازی و فیشیال", 5),
  ...galleryFor("haircolor", "رنگ مو", "رنگ و لایت مو", 5),
  ...galleryFor("lashes", "مژه", "اکستنشن مژه", 4),
  ...galleryFor("brows", "ابرو", "طراحی و لمینت ابرو", 4),
];
