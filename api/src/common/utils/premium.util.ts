import { PremiumTier } from '@prisma/client';

export function isPremiumActive(
  premiumTier: PremiumTier | string,
  premiumExpiresAt: Date | null,
): boolean {
  if (!premiumTier || premiumTier === PremiumTier.none) return false;
  if (!premiumExpiresAt) return true;
  return premiumExpiresAt.getTime() > Date.now();
}
