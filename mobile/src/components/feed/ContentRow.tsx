import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SectionHeader } from '@/components/home/SectionHeader';
import { spacing } from '@/theme/tokens';
import { commonStyles } from '@/theme/styles';

type Props = {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  bordered?: boolean;
  children: React.ReactNode;
};

export function ContentRow({
  title,
  eyebrow,
  actionLabel,
  onAction,
  bordered = true,
  children,
}: Props) {
  return (
    <View style={[styles.wrap, bordered && commonStyles.sectionDivider]}>
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        actionLabel={actionLabel}
        onAction={onAction}
      />
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    paddingTop: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.page,
    gap: spacing.md,
  },
});
