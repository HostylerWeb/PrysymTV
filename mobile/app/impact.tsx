import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { PageFooter } from '@/components/layout/PageFooter';
import { fetchPublicGafTransparency, type PublicGafTransparency } from '@/lib/api/gaf';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

const CATEGORY_LABELS: Record<string, string> = {
  economic: 'Economic development',
  workforce: 'Workforce development',
  housing: 'Housing initiatives',
  youth: 'Youth development',
};

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ImpactScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<PublicGafTransparency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPublicGafTransparency()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load impact data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Community Impact" showSearch={false} showNotifications={false} />

        <View style={styles.eyebrowRow}>
          <Ionicons name="heart-outline" size={18} color={colors.primary} />
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Community impact</Text>
        </View>
        <Text style={[styles.hero, { color: colors.foreground }]}>Global Advancement Fund</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          A portion of revenue on Prysym TV flows into the Global Advancement Fund (GAF) to support
          economic development, workforce training, housing, and youth programs.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : error || !data ? (
          <Text style={{ color: colors.destructive }}>{error ?? 'Impact data unavailable.'}</Text>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total inflow</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {formatUsd(data.summary.totalInflowUsd)}
                </Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Deployed</Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {formatUsd(data.summary.totalOutflowUsd)}
                </Text>
              </Card>
              <Card style={[styles.summaryCard, styles.summaryHighlight, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Fund balance</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {formatUsd(data.summary.balanceUsd)}
                </Text>
              </Card>
            </View>

            <Text style={[styles.section, { color: colors.foreground }]}>Program areas</Text>
            {data.programs.map((program) => (
              <Card key={program.id} style={styles.programCard}>
                <Text style={[styles.programCategory, { color: colors.primary }]}>
                  {CATEGORY_LABELS[program.category] ?? program.category}
                </Text>
                <Text style={[styles.programTitle, { color: colors.foreground }]}>{program.title}</Text>
                <Text style={[styles.programDesc, { color: colors.mutedForeground }]}>{program.description}</Text>
              </Card>
            ))}

            <Text style={[styles.section, { color: colors.foreground }]}>Funding by area</Text>
            {data.fundingByCategory.length > 0 ? (
              data.fundingByCategory.map((row) => (
                <View key={row.category ?? 'other'} style={[styles.fundingRow, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>
                    {CATEGORY_LABELS[row.category ?? ''] ?? row.category ?? 'Other'}
                  </Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{formatUsd(row.amountUsd)}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                Funding breakdown by program area will appear here as grants are awarded.
              </Text>
            )}

            <Text style={[styles.section, { color: colors.foreground }]}>Recent grants</Text>
            {data.recentGrants.length > 0 ? (
              <Card>
                {data.recentGrants.map((grant, i) => (
                  <View
                    key={grant.id}
                    style={[
                      styles.grantRow,
                      i < data.recentGrants.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                        {grant.programTitle ?? grant.description ?? 'Community grant'}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                        {new Date(grant.createdAt).toLocaleDateString()} · {CATEGORY_LABELS[grant.category ?? ''] ?? grant.category}
                      </Text>
                    </View>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{formatUsd(grant.amountUsd)}</Text>
                  </View>
                ))}
              </Card>
            ) : (
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                Recent community grants will appear here.
              </Text>
            )}
          </>
        )}

        <Pressable
          style={[styles.learnMore, { borderColor: colors.border }]}
          onPress={() => void Linking.openURL('mailto:support@prysym.tv?subject=GAF%20inquiry')}
        >
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', flex: 1 }}>Questions about community impact?</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        <PageFooter />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eyebrow: { ...typography.eyebrow },
  hero: { ...typography.hero, fontSize: 28, marginTop: 8, marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  summaryGrid: { gap: 10, marginBottom: 8 },
  summaryCard: { padding: 16 },
  summaryHighlight: { borderWidth: 1 },
  summaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  section: { ...typography.h2, marginTop: 24, marginBottom: 12 },
  programCard: { marginBottom: 10, padding: 16 },
  programCategory: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  programTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  programDesc: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  fundingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: 8,
  },
  grantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  emptyHint: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
});
