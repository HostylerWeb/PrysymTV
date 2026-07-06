import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme/tokens';

/** Bottom inset = system nav bar + tab bar (for scroll padding / shorts feed height). */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return insets.bottom + spacing.tabBar;
}
