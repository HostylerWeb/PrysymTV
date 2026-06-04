"use client";

import { useAuth } from "@/contexts/auth-context";
import { isPremiumActive } from "@/lib/premium";

/** False when the viewer has an active platform premium subscription. */
export function useShouldShowAds(): boolean {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return true;
  return !isPremiumActive(user.premiumTier, user.premiumExpiresAt);
}
