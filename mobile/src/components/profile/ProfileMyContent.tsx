import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { mockPodcastShows, mockShorts, mockVerticals, mockVideos } from '@/mocks';
import type { VideoCard } from '@/types/api';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type ContentTab = 'videos' | 'shorts' | 'verticals' | 'podcasts';

const TABS: { id: ContentTab; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'verticals', label: 'Verticals' },
  { id: 'podcasts', label: 'Podcasts' },
];

type Props = {
  onOpenVerticalUpload?: () => void;
  onOpenPodcastUpload?: () => void;
};

export function ProfileMyContent({ onOpenVerticalUpload, onOpenPodcastUpload }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<ContentTab>('videos');
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);

  const videos = useMemo(
    () => mockVideos.slice(0, 6).filter((v) => !deletedVideoIds.includes(v.id)),
    [deletedVideoIds],
  );
  const shorts = useMemo(
    () => mockShorts.slice(0, 4).filter((v) => !deletedVideoIds.includes(v.id)),
    [deletedVideoIds],
  );

  const confirmDelete = (video: VideoCard) => {
    Alert.alert('Delete content', `Delete "${video.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setDeletedVideoIds((prev) => [...prev, video.id]),
      },
    ]);
  };

  const renderGrid = (items: VideoCard[]) => (
    <View style={styles.grid}>
      {items.map((v) => (
        <View key={v.id} style={styles.half}>
          <VideoCardTile video={v} variant="grid" />
          <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(v)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            <ThemedText variant="caption" style={styles.deleteLabel}>
              Delete
            </ThemedText>
          </Pressable>
        </View>
      ))}
    </View>
  );

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTab(t.id)}
            >
              <ThemedText variant="bodyMedium" primary={active} muted={!active}>
                {t.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {tab === 'videos' && renderGrid(videos)}
      {tab === 'shorts' && renderGrid(shorts)}

      {tab === 'verticals' && (
        <View style={styles.list}>
          {mockVerticals.map((s) => (
            <Pressable
              key={s.slug}
              style={styles.seriesRow}
              onPress={() => router.push(`/verticals/${s.slug}`)}
            >
              <View style={{ flex: 1 }}>
                <ThemedText variant="bodyMedium">{s.title}</ThemedText>
                <ThemedText variant="caption" muted>
                  {s.episodeCount} episodes
                </ThemedText>
              </View>
              <Button label="Manage" variant="outline" size="sm" onPress={onOpenVerticalUpload} />
            </Pressable>
          ))}
          <Button label="Upload vertical episode" variant="ghost" onPress={onOpenVerticalUpload} />
        </View>
      )}

      {tab === 'podcasts' && (
        <View style={styles.list}>
          {mockPodcastShows.map((s) => (
            <Pressable key={s.id} style={styles.seriesRow} onPress={() => router.push('/settings/podcasts')}>
              <Ionicons name="mic-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="bodyMedium">{s.title}</ThemedText>
                <ThemedText variant="caption" muted>
                  {s.episodeCount} episodes
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
          <Button label="Upload podcast episode" variant="ghost" onPress={onOpenPodcastUpload} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: withAlpha(colors.secondary, 0.6),
  },
  chipActive: {
    backgroundColor: withAlpha(colors.primary, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.35),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { width: '48%' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: withAlpha(colors.destructive, 0.08),
  },
  deleteLabel: { color: colors.destructive, fontSize: 11 },
  list: { gap: spacing.sm },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.8),
  },
});
