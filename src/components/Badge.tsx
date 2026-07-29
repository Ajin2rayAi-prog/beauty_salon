import { cn, statusLabel } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("badge", className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusLabel(status);
  return <span className={cn("badge", s.cls)}>{s.label}</span>;
}
