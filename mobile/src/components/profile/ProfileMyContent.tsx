import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { Button } from '@/components/ui/Button';
import { mockPodcastShows, mockShorts, mockVerticals, mockVideos } from '@/mocks';
import type { VideoCard } from '@/types/api';
import type { ThemeColors } from '@/theme/tokens';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
            <Text style={styles.deleteLabel}>Delete</Text>
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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
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
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowMeta}>{s.episodeCount} episodes</Text>
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
                <Text style={styles.rowTitle}>{s.title}</Text>
                <Text style={styles.rowMeta}>{s.episodeCount} episodes</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabs: { gap: spacing.sm, marginBottom: spacing.lg },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary + '14',
      borderColor: colors.primary,
    },
    chipText: { color: colors.foreground, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: colors.primary },
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
      backgroundColor: colors.destructive + '14',
    },
    deleteLabel: { color: colors.destructive, fontSize: 11, fontWeight: '600' },
    list: { gap: spacing.sm },
    seriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowTitle: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    rowMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  });
}
