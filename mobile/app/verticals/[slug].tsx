import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { ShareModal } from '@/components/modals/ShareModal';
import { withContentServiceGate } from '@/components/layout/ContentServiceGate';
import { ReportModal } from '@/components/modals/ReportModal';
import { useVerticalSeriesDetail } from '@/hooks/api/useVerticalSeriesDetail';
import { toggleVerticalSeriesSave } from '@/lib/api/verticals';
import { radius } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { buildShareUrl } from '@/lib/share-url';

function VerticalSeriesScreen() {
  const styles = useThemedStyles(createStyles);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const seriesQuery = useVerticalSeriesDetail(slug);
  const series = seriesQuery.data;
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (seriesQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (seriesQuery.isError || !series) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={seriesQuery.error} onRetry={() => void seriesQuery.refetch()} />
      </View>
    );
  }

  const resumeEp = series.episodes[0]?.episodeNumber ?? 1;

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title={series.title} showSearch={false} showNotifications={false} />
        </View>
        <Image source={{ uri: series.bannerUrl ?? series.posterUrl ?? '' }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Text style={styles.desc}>{series.description ?? series.tagline}</Text>
          <Button
            label={`Play episode ${resumeEp}`}
            onPress={() => router.push(`/verticals/watch/${series.slug}/${resumeEp}`)}
          />
          <View style={styles.row}>
            <Button
              label={saved ? 'Saved' : 'Save series'}
              variant="outline"
              style={styles.flex}
              onPress={async () => {
                const res = await toggleVerticalSeriesSave(series.id);
                setSaved(res.saved);
              }}
            />
            <Button label="Share" variant="secondary" style={styles.flex} onPress={() => setShareOpen(true)} />
            <Button label="Report" variant="ghost" onPress={() => setReportOpen(true)} />
          </View>
          <Text style={styles.section}>Episodes ({series.episodes.length})</Text>
        </View>
        <FlatList
          data={series.episodes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.ep}
              onPress={() => router.push(`/verticals/watch/${series.slug}/${item.episodeNumber}`)}
            >
              <View style={styles.epThumb}>
                <Image source={{ uri: item.thumbnailUrl ?? series.posterUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </View>
              <View style={styles.epMeta}>
                <Text style={styles.epNum}>Ep {item.episodeNumber}</Text>
                <Text style={styles.epTitle}>{item.title}</Text>
                {item.cliffhanger ? (
                  <Text style={styles.epProgress} numberOfLines={1}>{item.cliffhanger}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      </View>
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={series.title}
        url={buildShareUrl(`/verticals/${series.slug}`)}
        targetId={series.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="vertical_series" targetId={series.id} />
    </>
  );
}

export default withContentServiceGate('verticals', VerticalSeriesScreen);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 16 },
  hero: { width: '100%', height: 220, backgroundColor: colors.secondary },
  body: { padding: 16, gap: 12 },
  desc: { color: colors.mutedForeground, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  section: { color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  ep: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  epThumb: {
    width: 80,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  epMeta: { flex: 1 },
  epNum: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  epTitle: { color: colors.foreground, fontSize: 15, marginTop: 2 },
  epProgress: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
  });
