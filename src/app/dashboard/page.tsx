import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { roleHome } from "@/lib/auth-guards";

export const metadata = { title: "داشبورد | سالن‌پرو" };

// Routes to the right panel based on the session role.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  redirect(roleHome((session.user as any).role));
}
