import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useStoreCart } from '@/context/StoreCartContext';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type Props = {
  creatorUsername: string;
};

export function StoreCartLink({ creatorUsername }: Props) {
  const router = useRouter();
  const { creatorUsername: cartCreator, itemCount } = useStoreCart();

  const count =
    cartCreator && cartCreator.toLowerCase() === creatorUsername.toLowerCase() ? itemCount : 0;

  if (count === 0) return null;

  return (
    <Pressable
      style={styles.link}
      onPress={() => router.push(`/creator/${creatorUsername}/store/cart`)}
    >
      <Ionicons name="bag-outline" size={14} color={colors.foreground} />
      <ThemedText variant="caption">Cart</ThemedText>
      <View style={styles.badge}>
        <ThemedText variant="micro" style={styles.badgeText}>
          {count}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.8),
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.primaryForeground, fontWeight: '800' },
});
