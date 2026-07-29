import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { roleHome } from "@/lib/auth-guards";
import LoginClient from "./LoginClient";

export const metadata = { title: "ورود | سالن‌پرو" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(roleHome(session.user.role));
  return <LoginClient />;
}
