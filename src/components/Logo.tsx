import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ec4889" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#lg)" opacity="0.18" />
      <path
        d="M24 9c-3.6 0-6.5 2.9-6.5 6.5 0 .8.2 1.6.4 2.3-2.2.9-3.9 3-3.9 5.7 0 3.3 2.7 6 6 6h.5v3.4c0 .9.7 1.6 1.6 1.6h3.8c.9 0 1.6-.7 1.6-1.6V29.5h.5c3.3 0 6-2.7 6-6 0-2.7-1.7-4.8-3.9-5.7.3-.7.4-1.5.4-2.3C30.5 11.9 27.6 9 24 9Z"
        fill="url(#lg)"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={34} />
      <span className="text-lg font-extrabold tracking-tight text-gradient">سالن‌پرو</span>
    </div>
  );
}
