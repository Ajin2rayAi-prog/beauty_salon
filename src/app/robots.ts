import type { MetadataRoute } from "next";

const BASE = process.env.NEXTAUTH_URL || "http://localhost:9091";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated panels out of the index.
        disallow: ["/admin", "/provider", "/customer", "/platform", "/dashboard", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
