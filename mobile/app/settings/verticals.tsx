import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { VerticalSeriesWizard } from '@/components/modals/VerticalSeriesWizard';
import { VerticalCreatorApplicationModal } from '@/components/modals/VerticalCreatorApplicationModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { fetchMyVerticalSeries } from '@/lib/api/verticals';
import { mediaThumb } from '@/lib/api/map-content';
import { colors, radius } from '@/theme/tokens';

export default function SettingsVerticalsScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  const seriesQuery = useQuery({
    queryKey: ['verticals', 'me', 'series'],
    queryFn: async () => {
      const data = await fetchMyVerticalSeries();
      return data.items;
    },
    enabled: user?.verticalCreatorStatus === 'approved',
  });

  const approved = user?.verticalCreatorStatus === 'approved';

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Micro-dramas" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Manage your vertical series, episodes, and publishing schedule.</Text>
          {approved ? (
            <>
              <Button label="Create new series" onPress={() => setWizardOpen(true)} style={{ marginBottom: 16 }} />
              <FeedQueryState
                isLoading={seriesQuery.isLoading}
                isError={seriesQuery.isError}
                error={seriesQuery.error}
                onRetry={() => void seriesQuery.refetch()}
                isEmpty={!seriesQuery.isLoading && (seriesQuery.data?.length ?? 0) === 0}
                emptyTitle="No series yet"
              >
                {(seriesQuery.data ?? []).map((s) => (
                  <Pressable key={s.slug} style={styles.row} onPress={() => router.push(`/verticals/${s.slug}`)}>
                    <Image source={{ uri: mediaThumb(s.posterUrl) ?? '' }} style={styles.poster} contentFit="cover" />
                    <View style={styles.meta}>
                      <Text style={styles.title}>{s.title}</Text>
                      <Text style={styles.ep}>
                        {(s.episodeCount ?? s.totalEpisodes) || 0} episodes{s.genre ? ` · ${s.genre}` : ''}
                      </Text>
                      <Button
                        label="Upload episode"
                        variant="ghost"
                        onPress={() => router.push(`/settings/upload?type=vertical&series=${s.slug}`)}
                      />
                    </View>
                  </Pressable>
                ))}
              </FeedQueryState>
            </>
          ) : (
            <>
              <Text style={styles.sub}>Apply to publish micro-drama series on Prysym TV.</Text>
              <Button label="Apply for vertical creator" onPress={() => setApplyOpen(true)} />
            </>
          )}
        </View>
      </ScrollView>
      <VerticalSeriesWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => void seriesQuery.refetch()}
      />
      <VerticalCreatorApplicationModal visible={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poster: { width: 48, height: 64, borderRadius: 6 },
  meta: { flex: 1, justifyContent: 'center' },
  title: { color: colors.foreground, fontWeight: '700' },
  ep: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
});
