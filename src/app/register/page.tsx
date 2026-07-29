import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { roleHome } from "@/lib/auth-guards";
import RegisterClient from "./RegisterClient";

export const metadata = { title: "ثبت‌نام | سالن‌پرو" };

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(roleHome(session.user.role));
  return <RegisterClient />;
}
