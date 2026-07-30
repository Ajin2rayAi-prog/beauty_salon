import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXTAUTH_URL || "http://localhost:9091";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Only list active salons; the public page dark-gates unlicensed ones anyway.
  const salons = await prisma.salon
    .findMany({ where: { active: true }, select: { slug: true, createdAt: true } })
    .catch(() => [] as { slug: string; createdAt: Date }[]);

  const salonEntries: MetadataRoute.Sitemap = salons.map((s) => ({
    url: `${BASE}/s/${s.slug}`,
    lastModified: s.createdAt ?? now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...salonEntries];
}
