/** True when the user has an active platform premium subscription. */
export function isPremiumActive(
  premiumTier: string | undefined | null,
  premiumExpiresAt: string | null | undefined,
): boolean {
  if (!premiumTier || premiumTier === 'none') return false;
  if (!premiumExpiresAt) return true;
  return new Date(premiumExpiresAt).getTime() > Date.now();
}

export function isInsiderActive(
  insiderActive: boolean | undefined,
  insiderPeriodEnd: string | null | undefined,
): boolean {
  if (!insiderActive) return false;
  if (!insiderPeriodEnd) return true;
  return new Date(insiderPeriodEnd).getTime() > Date.now();
}
