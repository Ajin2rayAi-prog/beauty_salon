import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Combined middleware:
 *  1) Subdomain → salon rewrite. On `{sub}.{ROOT_DOMAIN}` we internally rewrite
 *     public paths to `/s/{sub}/...` so each salon gets its own site on its own
 *     subdomain, all served from the one deployment. The salon page resolves the
 *     salon by subdomain OR slug. (No DB access here — edge-safe.)
 *  2) Auth gating for the panel routes (via next-auth withAuth) — public routes
 *     and subdomain salon sites are always allowed through.
 */

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || "localhost").toLowerCase();
const PROTECTED = ["/admin", "/provider", "/customer", "/platform", "/dashboard"];

/** Extract a salon subdomain label from the Host header, or null. */
function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase(); // strip port
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;
  // {sub}.{ROOT_DOMAIN}
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const label = hostname.slice(0, -(ROOT_DOMAIN.length + 1));
    if (!label || label === "www") return null;
    return label.split(".").pop() || null; // last label if nested
  }
  // bare IP / vercel preview / unknown host -> no subdomain
  return null;
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const sub = getSubdomain(req.headers.get("host"));

    if (
      sub &&
      !pathname.startsWith("/s/") &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next/") &&
      !PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
      !pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|txt|xml|css|js)$/)
    ) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${sub}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only the panel prefixes require a session; everything else is public.
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;
        const needsAuth = PROTECTED.some((x) => p === x || p.startsWith(x + "/"));
        return needsAuth ? !!token : true;
      },
    },
  }
);

export const config = {
  // Run on everything except Next internals and the auth API.
  matcher: ["/((?!_next/static|_next/image|api/auth|favicon.ico).*)"],
};
