import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMyCreatorContent } from '@/hooks/api/useMyCreatorContent';
import { deleteMyVideo } from '@/lib/api/videos';
import { deletePodcastEpisode, deletePodcastShow } from '@/lib/api/podcasts';
import { deleteVerticalEpisode, deleteVerticalSeries } from '@/lib/api/verticals';
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
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState<ContentTab>('videos');
  const contentQuery = useMyCreatorContent();

  const refreshContent = () => {
    void queryClient.invalidateQueries({ queryKey: ['profile', 'my-content'] });
  };

  const confirmDelete = (video: VideoCard) => {
    Alert.alert('Delete content', `Delete "${video.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteMyVideo(video.id);
              refreshContent();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete video');
            }
          })();
        },
      },
    ]);
  };

  const confirmDeletePodcastEpisode = (title: string, episodeId: string) => {
    Alert.alert('Delete episode', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePodcastEpisode(episodeId);
              refreshContent();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete episode');
            }
          })();
        },
      },
    ]);
  };

  const confirmDeletePodcastShow = (title: string, showId: string) => {
    Alert.alert('Delete show', `Delete "${title}" and all its episodes? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePodcastShow(showId);
              refreshContent();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete show');
            }
          })();
        },
      },
    ]);
  };

  const confirmDeleteVerticalSeries = (title: string, slug: string) => {
    Alert.alert('Delete series', `Delete "${title}" and all its episodes? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteVerticalSeries(slug);
              refreshContent();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete series');
            }
          })();
        },
      },
    ]);
  };

  const confirmDeleteVerticalEpisode = (title: string, episodeId: string) => {
    Alert.alert('Delete episode', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteVerticalEpisode(episodeId);
              refreshContent();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete episode');
            }
          })();
        },
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

  if (contentQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (contentQuery.isError) {
    return (
      <FeedQueryState
        isError
        error={contentQuery.error}
        onRetry={() => void contentQuery.refetch()}
      />
    );
  }

  const data = contentQuery.data!;

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

      {tab === 'videos' && (
        data.videos.length === 0 ? (
          <Text style={styles.empty}>No videos uploaded yet.</Text>
        ) : (
          renderGrid(data.videos)
        )
      )}

      {tab === 'shorts' && (
        data.shorts.length === 0 ? (
          <Text style={styles.empty}>No shorts uploaded yet.</Text>
        ) : (
          renderGrid(data.shorts)
        )
      )}

      {tab === 'verticals' && (
        <View style={styles.list}>
          {data.verticals.length === 0 ? (
            <Text style={styles.empty}>No vertical series yet.</Text>
          ) : (
            data.verticals.map((s) => (
              <View key={s.slug} style={styles.seriesBlock}>
                <View style={styles.seriesRow}>
                  <Pressable style={{ flex: 1 }} onPress={() => router.push(`/verticals/${s.slug}`)}>
                    <Text style={styles.rowTitle}>{s.title}</Text>
                    <Text style={styles.rowMeta}>{s.episodeCount} episodes</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtnSmall}
                    onPress={() => confirmDeleteVerticalSeries(s.title, s.slug)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </Pressable>
                  <Button label="Manage" variant="outline" size="sm" onPress={onOpenVerticalUpload} />
                </View>
                {s.episodes.map((ep) => (
                  <View key={ep.id} style={styles.episodeRow}>
                    <Text style={styles.episodeTitle} numberOfLines={1}>
                      Ep {ep.episodeNumber}: {ep.title}
                    </Text>
                    <Pressable
                      style={styles.deleteBtnSmall}
                      onPress={() => confirmDeleteVerticalEpisode(ep.title, ep.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ))
          )}
          <Button label="Upload vertical episode" variant="ghost" onPress={onOpenVerticalUpload} />
        </View>
      )}

      {tab === 'podcasts' && (
        <View style={styles.list}>
          {data.podcasts.length === 0 ? (
            <Text style={styles.empty}>No podcast shows yet.</Text>
          ) : (
            data.podcasts.map((s) => (
              <View key={s.id} style={styles.seriesBlock}>
                <View style={styles.seriesRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{s.title}</Text>
                    <Text style={styles.rowMeta}>{s.episodeCount} episodes</Text>
                  </View>
                  <Pressable
                    style={styles.deleteBtnSmall}
                    onPress={() => confirmDeletePodcastShow(s.title, s.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
                {s.episodes.map((ep) => (
                  <View key={ep.id} style={styles.episodeRow}>
                    <Pressable style={{ flex: 1 }} onPress={() => router.push(`/podcast/${ep.id}`)}>
                      <Text style={styles.episodeTitle} numberOfLines={1}>
                        {ep.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteBtnSmall}
                      onPress={() => confirmDeletePodcastEpisode(ep.title, ep.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ))
          )}
          <Button label="Upload podcast episode" variant="ghost" onPress={onOpenPodcastUpload} />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: { paddingVertical: spacing.xl, alignItems: 'center' },
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
    seriesBlock: {
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    seriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    episodeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    episodeTitle: { flex: 1, color: colors.foreground, fontSize: 13 },
    deleteBtnSmall: {
      padding: 6,
      borderRadius: radius.md,
      backgroundColor: colors.destructive + '14',
    },
    rowTitle: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    rowMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
    empty: { color: colors.mutedForeground, textAlign: 'center', paddingVertical: spacing.lg },
  });
}
