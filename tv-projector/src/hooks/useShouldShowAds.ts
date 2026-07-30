import { useAuth } from '@/context/AuthContext';
import { isPremiumActive } from '@/lib/premium';

export function useShouldShowAds(): boolean {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return true;
  return !isPremiumActive(user.premiumTier, user.premiumExpiresAt);
}
