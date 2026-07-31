import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

type DbUser = {
  id: string; name: string; email: string; role: string;
  avatar: string | null; tenantId: string | null; salonId: string | null;
};

// Shape returned to NextAuth from authorize().
function sessionUser(u: DbUser) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    avatar: u.avatar, tenantId: u.tenantId, salonId: u.salonId,
  };
}

// Keep phone numbers comparable: strip spaces/dashes, normalize +98/0098 -> 0.
export function normalizePhone(raw: string): string {
  let p = String(raw).replace(/[\s-]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("0098")) p = "0" + p.slice(4);
  else if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
  return p;
}

// Verify a one-time code against the freshest live Otp row for this phone.
// Consumes (deletes) matching codes on success; counts attempts otherwise.
async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;
  if (otp.attempts >= 5) return false;
  const ok = await bcrypt.compare(String(code).trim(), otp.codeHash);
  if (!ok) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } }).catch(() => {});
    return false;
  }
  await prisma.otp.deleteMany({ where: { phone } }).catch(() => {});
  return true;
}

// Find the customer account for a phone, or create a fresh CUSTOMER user.
async function findOrCreateCustomer(phone: string): Promise<DbUser | null> {
  const existing = await prisma.user.findFirst({ where: { phone } });
  if (existing) return existing.active ? existing : null;
  const randomPass = await bcrypt.hash(`otp-${phone}-${Date.now()}`, 10);
  return prisma.user.create({
    data: {
      name: `کاربر ${phone.slice(-4)}`,
      email: `${phone}@phone.local`,
      phone,
      password: randomPass,
      role: "CUSTOMER",
    },
  });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        // ── Staff / email login (unchanged) ─────────────────────────────
        if (credentials?.email && credentials?.password) {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user || !user.active) return null;
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;
          return sessionUser(user);
        }

        // ── Customer phone login: phone + password OR phone + OTP ────────
        if (credentials?.phone) {
          const phone = normalizePhone(credentials.phone);

          // OTP path: verify a live code, then find-or-create the customer.
          if (credentials.otp) {
            const ok = await verifyOtp(phone, credentials.otp);
            if (!ok) return null;
            const user = await findOrCreateCustomer(phone);
            return user ? sessionUser(user) : null;
          }

          // Password path: existing customer with a matching password.
          if (credentials.password) {
            const user = await prisma.user.findFirst({ where: { phone } });
            if (!user || !user.active) return null;
            const valid = await bcrypt.compare(credentials.password, user.password);
            if (!valid) return null;
            return sessionUser(user);
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        token.tenantId = (user as any).tenantId;
        token.salonId = (user as any).salonId;
      }
      // refresh volatile fields from DB so changes show without re-login
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { avatar: true, tenantId: true, salonId: true, active: true },
        });
        if (!fresh || !fresh.active) {
          // deactivated mid-session -> invalidate by clearing role
          token.role = "";
        }
        if (fresh) {
          token.avatar = fresh.avatar;
          token.tenantId = fresh.tenantId;
          token.salonId = fresh.salonId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).salonId = token.salonId;
      }
      return session;
    },
  },
};
