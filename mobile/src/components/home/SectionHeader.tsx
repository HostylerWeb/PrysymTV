import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { commonStyles } from '@/theme/styles';

type Props = {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, eyebrow, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={commonStyles.accentBar} />
        <View style={styles.titles}>
          {eyebrow ? (
            <ThemedText variant="eyebrow" muted style={styles.eyebrow}>
              {eyebrow}
            </ThemedText>
          ) : null}
          <ThemedText variant="section">{title}</ThemedText>
        </View>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action} hitSlop={8}>
          <ThemedText variant="bodyMedium" muted style={styles.actionText}>
            {actionLabel}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.page,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    marginBottom: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  actionText: {},
});
