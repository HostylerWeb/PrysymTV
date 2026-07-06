import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { getMockVertical } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

const EPISODE_PROGRESS: Record<number, number> = { 1: 1, 2: 0.65, 3: 0.2 };

export default function VerticalSeriesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const series = getMockVertical(slug ?? '') ?? getMockVertical('series-1')!;
  const episodes = Array.from({ length: 8 }, (_, i) => i + 1);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const resumeEp = episodes.find((n) => {
    const p = EPISODE_PROGRESS[n];
    return p !== undefined && p > 0 && p < 1;
  }) ?? 1;

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title={series.title} showSearch={false} showNotifications={false} />
        </View>
        <Image source={{ uri: series.posterUrl ?? '' }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <Text style={styles.desc}>{series.description}</Text>
          <Button label={`Resume episode ${resumeEp}`} onPress={() => router.push(`/verticals/watch/${series.slug}/${resumeEp}`)} />
          <Button label="Play episode 1" variant="outline" onPress={() => router.push(`/verticals/watch/${series.slug}/1`)} />
          <View style={styles.row}>
            <Button label={saved ? 'Saved' : 'Save series'} variant="outline" style={styles.flex} onPress={() => { setSaved(!saved); setSaveOpen(true); }} />
            <Button label="Share" variant="secondary" style={styles.flex} onPress={() => setShareOpen(true)} />
            <Button label="Report" variant="ghost" onPress={() => setReportOpen(true)} />
          </View>
          <Text style={styles.section}>Episodes</Text>
        </View>
        <FlatList
          data={episodes}
          keyExtractor={(n) => String(n)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const progress = EPISODE_PROGRESS[item] ?? 0;
            const watched = progress >= 1;
            return (
              <Pressable style={styles.ep} onPress={() => router.push(`/verticals/watch/${series.slug}/${item}`)}>
                <View style={styles.epThumb}>
                  <Image source={{ uri: series.posterUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {progress > 0 && progress < 1 ? (
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                  ) : null}
                  {watched ? (
                    <View style={styles.watchedBadge}>
                      <Text style={styles.watchedText}>Watched</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.epMeta}>
                  <Text style={styles.epNum}>Ep {item}</Text>
                  <Text style={styles.epTitle}>Episode {item}</Text>
                  {progress > 0 && progress < 1 ? (
                    <Text style={styles.epProgress}>{Math.round(progress * 100)}% watched</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={series.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
      <AddToPlaylistSheet visible={saveOpen} onClose={() => setSaveOpen(false)} contentTitle={series.title} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  watchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary + 'CC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  watchedText: { color: colors.primaryForeground, fontSize: 8, fontWeight: '800' },
  epMeta: { flex: 1 },
  epNum: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  epTitle: { color: colors.foreground, fontSize: 15, marginTop: 2 },
  epProgress: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
});
