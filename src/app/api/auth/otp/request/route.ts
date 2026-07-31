import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/auth";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 2 * 60 * 1000; // codes live 2 minutes
const RESEND_COOLDOWN_MS = 45 * 1000; // one code per 45s per phone

// POST /api/auth/otp/request  { phone }
// Sends a 5-digit SMS login code (Kavenegar). In non-production the code is
// echoed back as `devCode` so local testing works without SMS credentials.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));

  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "شماره موبایل معتبر نیست" }, { status: 400 });
  }

  // simple per-phone rate limit
  const recent = await prisma.otp.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return NextResponse.json({ error: "کد به‌تازگی ارسال شده؛ کمی صبر کنید" }, { status: 429 });
  }

  const code = String(Math.floor(10000 + Math.random() * 90000)); // 5 digits
  const codeHash = await bcrypt.hash(code, 10);

  // invalidate any older codes, then store the new one
  await prisma.otp.deleteMany({ where: { phone } }).catch(() => {});
  await prisma.otp.create({
    data: { phone, codeHash, purpose: "LOGIN", expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  const sms = await notify({
    phone,
    title: "کد ورود",
    body: `کد ورود شما: ${code}\nاین کد تا ۲ دقیقه معتبر است.`,
  });

  const devMode = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    sent: sms.sms ?? "unknown",
    ...(devMode ? { devCode: code } : {}),
  });
}
