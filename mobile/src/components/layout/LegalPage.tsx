import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { LAST_UPDATED } from '@legal/company';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function LegalPage({ title, description, children }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader showBack title={title} showSearch={false} showNotifications={false} />
      <View style={styles.intro}>
        {description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
        ) : null}
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>Last updated: {LAST_UPDATED}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
      <PageFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.page, paddingBottom: 40 },
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  description: { fontSize: 14, lineHeight: 22 },
  updated: { fontSize: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: 12,
  },
});

// Legacy exports kept for any remaining imports; prefer LegalDocumentBody for new content.
export function LegalParagraph({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[typography.bodyMedium, { color: colors.mutedForeground, lineHeight: 22 }]}>{children}</Text>;
}

export function LegalHeading({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[typography.h3, { color: colors.foreground, marginTop: 4 }]}>{children}</Text>;
}
