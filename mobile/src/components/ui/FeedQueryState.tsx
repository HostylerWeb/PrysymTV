import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  children?: React.ReactNode;
};

export function FeedQueryState({
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Check back later for new content.',
  children,
}: Props) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.mutedForeground} />
        <ThemedText variant="body" style={styles.msg}>
          {error?.message ?? 'Could not load content.'}
        </ThemedText>
        {onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Ionicons name="albums-outline" size={36} color={colors.mutedForeground} />
        <ThemedText variant="body" style={styles.title}>
          {emptyTitle}
        </ThemedText>
        <ThemedText variant="caption" muted style={styles.msg}>
          {emptyMessage}
        </ThemedText>
        {onRetry ? (
          <Pressable onPress={onRetry}>
            <ThemedText variant="caption" primary style={{ fontWeight: '700', marginTop: 8 }}>
              Refresh
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}
const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  title: { fontWeight: '700', marginTop: 4 },
  msg: { textAlign: 'center', marginBottom: 4 },
});
