import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/auth";

// Customer self-signup. Two entry points:
//  - phone-based (from the booking gate): { name?, phone, password }
//  - email-based (classic form):          { name, email, phone?, password }
// Creates a CUSTOMER user only; salon binding happens when they book.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = rawPhone ? normalizePhone(rawPhone) : "";
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!phone && !email) {
      return NextResponse.json({ error: "شماره موبایل یا ایمیل الزامی است" }, { status: 400 });
    }
    if (phone && !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "شماره موبایل معتبر نیست" }, { status: 400 });
    }

    // password complexity: min 8 chars with lower + upper + digit
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: "رمز باید حداقل ۸ کاراکتر و شامل حروف کوچک، بزرگ و عدد باشد" },
        { status: 400 }
      );
    }

    // uniqueness checks
    if (phone) {
      const byPhone = await prisma.user.findFirst({ where: { phone } });
      if (byPhone) return NextResponse.json({ error: "این شماره قبلاً ثبت شده؛ وارد شوید" }, { status: 409 });
    }
    const finalEmail = email || `${phone}@phone.local`;
    const byEmail = await prisma.user.findUnique({ where: { email: finalEmail } });
    if (byEmail) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده" }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: name || (phone ? `کاربر ${phone.slice(-4)}` : "کاربر"),
        email: finalEmail,
        phone: phone || null,
        password: hash,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
