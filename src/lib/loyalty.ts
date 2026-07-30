/**
 * باشگاه مشتریان (loyalty) — points & tiers.
 *
 * Points are earned per successful payment (1 point per POINT_PER_TOMAN toman).
 * Tier is derived from the running points total. Callers should only invoke
 * this when the salon has the `loyalty` feature enabled.
 */
import { prisma } from "./prisma";

export const POINT_PER_TOMAN = 10_000; // 1 امتیاز به ازای هر ۱۰٬۰۰۰ تومان

export const TIER_THRESHOLDS: { tier: string; min: number }[] = [
  { tier: "GOLD", min: 500 },
  { tier: "SILVER", min: 150 },
  { tier: "BRONZE", min: 0 },
];

export function tierForPoints(points: number): string {
  return TIER_THRESHOLDS.find((t) => points >= t.min)?.tier ?? "BRONZE";
}

/** Add points for a payment and recompute the customer's tier. Returns new totals. */
export async function awardLoyaltyForPayment(customerId: string, amount: number) {
  const gained = Math.floor((amount || 0) / POINT_PER_TOMAN);
  if (gained <= 0) return null;
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { loyaltyPoints: true } });
  if (!customer) return null;
  const points = customer.loyaltyPoints + gained;
  return prisma.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: points, loyaltyTier: tierForPoints(points) },
    select: { loyaltyPoints: true, loyaltyTier: true },
  });
}
