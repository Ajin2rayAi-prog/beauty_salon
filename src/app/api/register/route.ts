import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/auth-guards";

// Customer self-signup. Creates a User (CUSTOMER role) only — no salon binding
// yet; the customer becomes scoped to a salon when they book there.
export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "رمز عبور حداقل ۶ کاراکتر" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hash,
        role: ROLES.CUSTOMER,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
