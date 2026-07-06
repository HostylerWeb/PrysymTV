import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { LiveStreamCard } from '@/components/feed/LiveStreamCard';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { FilterChip } from '@/components/ui/FilterChip';
import { Button } from '@/components/ui/Button';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockLiveStreams, mockVideos } from '@/mocks';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const CATEGORIES = ['All', 'Gaming', 'Music', 'Talk', 'Education', 'Sports'] as const;
const MODES = ['All', 'Videos', 'Live'] as const;
const SORTS = ['Popular', 'Newest'] as const;

export default function VideosScreen() {
  const tabInset = useTabBarInset();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [mode, setMode] = useState<(typeof MODES)[number]>('All');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Popular');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [search, category, mode, sort]);

  const videos = useMemo(() => {
    let list = [...mockVideos];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q));
    }
    if (category !== 'All') {
      list = list.filter((_, i) => i % CATEGORIES.length === CATEGORIES.indexOf(category));
    }
    if (sort === 'Newest') list = [...list].reverse();
    return list;
  }, [search, sort, category]);

  const showLive = mode !== 'Videos';
  const showVideos = mode !== 'Live';
  const visibleVideos = videos.slice(0, visibleCount);
  const hasMore = visibleCount < videos.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabInset + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterBar}>
          <View style={styles.headerPad}>
            <AppHeader showCreate searchScope="video" onCreatePress={() => requireAuth(() => trigger('video'))} />
          </View>

          <Text style={styles.pageTitle}>Videos</Text>
          <Text style={styles.pageSub}>Long-form creator videos, live streams, and categories</Text>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search videos..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={category === c}
                variant="primary"
                onPress={() => setCategory(c)}
                style={styles.chipGap}
              />
            ))}
          </ScrollView>

          <View style={styles.modeRow}>
            <View style={styles.modeGroup}>
              {MODES.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.modeBtn, mode === m && styles.modeBtnOn]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeText, mode === m && styles.modeTextOn]}>{m}</Text>
                </Pressable>
              ))}
            </View>
            {SORTS.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={sort === s}
                variant="soft"
                onPress={() => setSort(s)}
                style={styles.chipGap}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {showLive && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.livePulse} />
                <Text style={styles.sectionTitle}>Live now</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveRow}>
                {mockLiveStreams.map((stream) => (
                  <View key={stream.id} style={styles.liveCardWrap}>
                    <LiveStreamCard stream={stream} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {showVideos && (
            <View style={styles.section}>
              {videos.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="videocam-off-outline" size={36} color={colors.mutedForeground} />
                  <Text style={styles.emptyTitle}>No videos found</Text>
                  <Text style={styles.emptySub}>Try a different category or clear your search.</Text>
                  {search.length > 0 && (
                    <Button label="Clear search" variant="outline" onPress={() => setSearch('')} />
                  )}
                </View>
              ) : (
                <>
                  {visibleVideos.map((video) => (
                    <VideoCardTile key={video.id} video={video} variant="grid" />
                  ))}
                  {hasMore ? (
                    <Button
                      label="Load more"
                      variant="outline"
                      onPress={() => setVisibleCount((n) => n + 6)}
                      style={styles.loadMore}
                    />
                  ) : null}
                </>
              )}
            </View>
          )}
        </View>
        <PageFooter />
      </ScrollView>
      {flowHost}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filterBar: {
    backgroundColor: colors.background + 'F2',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerPad: { marginHorizontal: -spacing.page, paddingHorizontal: spacing.page },
  pageTitle: { ...typography.h2, color: colors.foreground, fontWeight: '800', marginTop: spacing.sm },
  pageSub: { color: colors.mutedForeground, fontSize: 12, marginBottom: spacing.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '99',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    height: 40,
    marginTop: spacing.sm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.foreground, fontSize: 14 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chipGap: { marginRight: 0 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  modeGroup: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '80',
    borderRadius: radius.full,
    padding: 2,
  },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  modeBtnOn: { backgroundColor: colors.background },
  modeText: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
  modeTextOn: { color: colors.foreground },
  content: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.foreground },
  liveRow: { gap: 12, paddingRight: spacing.page },
  liveCardWrap: { width: 300 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 16 },
  emptyTitle: { color: colors.foreground, fontWeight: '700', fontSize: 16 },
  emptySub: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 8 },
  loadMore: { marginTop: 12 },
});
