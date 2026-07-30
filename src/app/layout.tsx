import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:9091"),
  title: "سالن | پلتفرم مدیریت و رزرو سالن زیبایی",
  description:
    "رزرو آنلاین نوبت، مدیریت لاین‌های زیبایی، صف جایگزین خودکار و گزارش مالی برای سالن‌های زیبایی بانوان",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f0716",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* set theme before paint to avoid a flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('salon-theme');if(!t){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--card-solid)",
                color: "var(--text)",
                border: "1px solid rgba(255,77,151,0.32)",
                borderRadius: "14px",
                backdropFilter: "blur(12px)",
                direction: "rtl",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
