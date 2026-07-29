import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "سالن | پلتفرم مدیریت و رزرو سالن زیبایی",
  description:
    "رزرو آنلاین نوبت، مدیریت لاین‌های زیبایی، صف جایگزین خودکار و گزارش مالی برای سالن‌های زیبایی بانوان",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#2b1535",
                color: "#fdf2f6",
                border: "1px solid rgba(236,72,137,0.3)",
                direction: "rtl",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
