export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/admin/:path*",
    "/provider/:path*",
    "/customer/:path*",
    "/platform/:path*",
    "/dashboard/:path*",
  ],
};
