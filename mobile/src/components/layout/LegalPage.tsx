import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function LegalPage({ title, children }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader showBack title={title} showSearch={false} showNotifications={false} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
      <PageFooter />
    </ScrollView>
  );
}

export function LegalParagraph({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

export function LegalHeading({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.heading, { color: colors.foreground }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: 12,
    marginTop: spacing.sm,
  },
  heading: { ...typography.h3, marginTop: 4 },
  body: { fontSize: 14, lineHeight: 22 },
});
