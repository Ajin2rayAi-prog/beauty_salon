import { requireRole, ROLES } from "@/lib/auth-guards";
import { PanelShell, NavItem } from "@/components/PanelShell";
import { LayoutDashboard, Building2, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([ROLES.PLATFORM]);

  const items: NavItem[] = [
    { href: "/platform", label: "داشبورد", icon: LayoutDashboard },
    { href: "/platform/tenants", label: "کارفرماها و سالن‌ها", icon: Building2 },
    { href: "/platform/licenses", label: "لایسنس‌ها", icon: BadgeCheck },
  ];

  return (
    <PanelShell roleLabel="مدیریت پلتفرم • سالن‌پرو" items={items} user={{ name: user.name ?? "مالک پلتفرم", avatar: user.avatar }}>
      {children}
    </PanelShell>
  );
}
