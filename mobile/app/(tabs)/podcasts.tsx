import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FilterChip } from '@/components/ui/FilterChip';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { PodcastMiniPlayer } from '@/components/podcasts/PodcastMiniPlayer';
import { usePodcastPlayer } from '@/context/PodcastPlayerContext';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { usePodcastsCatalog } from '@/hooks/api/usePodcastsCatalog';
import { fetchPodcastCategories } from '@/lib/api/categories';
import type { PodcastShow } from '@/types/api';
import { radius, typography, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatDuration } from '@/utils/format-media';

const FALLBACK_PODCAST_FILTER_CATEGORIES = [
  'All',
  'True Crime',
  'Tech',
  'Business',
  'Comedy',
  'Health',
  'Society',
  'Science',
  'Sports',
  'Music',
];

type PodcastStyles = ReturnType<typeof createPodcastStyles>;

function ShowRail({
  title,
  shows,
  onShowPress,
  styles,
}: {
  title: string;
  shows: PodcastShow[];
  onShowPress: (show: PodcastShow) => void;
  styles: PodcastStyles;
}) {
  if (!shows.length) return null;
  return (
    <View style={styles.railWrap}>
      <SectionHeader title={title} />
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {shows.map((show) => (
          <Pressable key={show.id} style={styles.showCard} onPress={() => onShowPress(show)}>
            <Image source={{ uri: show.coverUrl ?? '' }} style={styles.showCover} contentFit="cover" />
            <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
            <Text style={styles.showMeta}>{show.creatorName}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function PodcastsScreen() {
  const styles = useThemedStyles(createPodcastStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const { playEpisode, episode: playingEpisode } = usePodcastPlayer();
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(FALLBACK_PODCAST_FILTER_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchPodcastCategories()
      .then((res) => {
        if (res.items.length > 0) {
          setCategories(['All', ...res.items.map((c) => c.label)]);
        }
      })
      .catch(() => setCategories(FALLBACK_PODCAST_FILTER_CATEGORIES));
  }, []);

  const catalogQuery = usePodcastsCatalog();
  const catalog = catalogQuery.data;
  const featuredShow = catalog?.featuredShow ?? catalog?.shows[0] ?? null;
  const featuredEpisode = catalog?.episodes[0] ?? null;

  const filteredShows = useMemo(() => {
    const shows = catalog?.trendingShows ?? [];
    if (category === 'All') return shows;
    return shows.filter((s) => s.category === category);
  }, [catalog?.trendingShows, category]);

  const filteredEpisodes = useMemo(() => {
    const episodes = catalog?.episodes ?? [];
    if (category === 'All') return episodes;
    const showTitles = new Set(filteredShows.map((s) => s.title));
    return episodes.filter((e) => showTitles.has(e.showTitle));
  }, [catalog?.episodes, category, filteredShows]);

  const openShow = (show: PodcastShow) => {
    const ep = catalog?.episodes.find((e) => e.showTitle === show.title) ?? catalog?.episodes[0];
    if (!ep) return;
    // Navigate first — detail screen owns playback to avoid mini-player flash.
    router.push(`/podcast/${ep.id}`);
  };

  const isLoading = catalogQuery.isLoading && !catalog;

  const onRefresh = async () => {
    setRefreshing(true);
    await catalogQuery.refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (catalogQuery.isError) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={catalogQuery.error} onRetry={() => void catalogQuery.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        nestedScrollEnabled
        data={filteredEpisodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: playingEpisode ? 72 : 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListHeaderComponent={
          <View style={styles.pad}>
            <AppHeader
              title="Podcasts"
              showCreate
              searchScope="podcast"
              onCreatePress={() => requireAuth(() => trigger('podcast'))}
            />

            {featuredShow && featuredEpisode ? (
              <Pressable
                style={styles.hero}
                onPress={() => {
                  playEpisode(featuredEpisode);
                  router.push(`/podcast/${featuredEpisode.id}`);
                }}
              >
                <Image source={{ uri: featuredShow.coverUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', withAlpha(colors.background, 0.95)]} style={StyleSheet.absoluteFill} />
                <View style={styles.heroContent}>
                  <Text style={styles.heroEyebrow}>Featured show</Text>
                  <Text style={styles.heroTitle}>{featuredShow.title}</Text>
                  <Text style={styles.heroSub}>{featuredShow.creatorName} · {featuredShow.episodeCount} episodes</Text>
                  <Button
                    label="Play latest episode"
                    size="sm"
                    onPress={() => {
                      playEpisode(featuredEpisode);
                      router.push(`/podcast/${featuredEpisode.id}`);
                    }}
                  />
                </View>
              </Pressable>
            ) : null}

            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {categories.map((c) => (
                <FilterChip key={c} label={c} active={category === c} onPress={() => setCategory(c)} style={styles.catChip} />
              ))}
            </ScrollView>

            <ShowRail title="Trending shows" shows={filteredShows.slice(0, 3)} onShowPress={openShow} styles={styles} />
            <ShowRail
              title="Featured shows"
              shows={category === 'All' ? (catalog?.shows ?? []) : filteredShows}
              onShowPress={openShow}
              styles={styles}
            />

            <Text style={styles.section}>Latest episodes</Text>
          </View>
        }
        ListEmptyComponent={
          <FeedQueryState
            isEmpty
            emptyTitle="No episodes yet"
            emptyMessage="Podcast episodes will appear here when published."
            onRetry={() => void catalogQuery.refetch()}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.episode}
            onPress={() => {
              playEpisode(item);
              router.push(`/podcast/${item.id}`);
            }}
          >
            <Image source={{ uri: item.coverUrl ?? '' }} style={styles.epCover} contentFit="cover" />
            <View style={styles.epInfo}>
              <Text style={styles.epTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.epMeta}>{item.showTitle} · {formatDuration(item.durationSeconds)}</Text>
              <View style={styles.epActions}>
                <Text style={styles.badge}>{item.mediaType === 'video' ? 'Video' : 'Audio'}</Text>
                <Pressable hitSlop={8} onPress={() => playEpisode(item)} style={styles.playIcon}>
                  <Ionicons name="play-circle" size={28} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListFooterComponent={<PageFooter />}
      />
      <PodcastMiniPlayer />
      {flowHost}
    </View>
  );
}

function createPodcastStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { flex: 1 },
    pad: { paddingHorizontal: 16 },
    hero: {
      height: 200,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroContent: { flex: 1, justifyContent: 'flex-end', padding: 16 },
    heroEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', marginBottom: 4 },
    heroTitle: { color: colors.foreground, fontSize: 22, fontWeight: '800' },
    heroSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 4, marginBottom: 12 },
    catRow: { gap: 8, marginBottom: 16, paddingRight: 8 },
    catChip: { marginRight: 0 },
    railWrap: { marginBottom: 8 },
    rail: { gap: 12, paddingRight: 8 },
    showCard: { width: 120 },
    showCover: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.secondary },
    showTitle: { color: colors.foreground, fontSize: 12, fontWeight: '600', marginTop: 6 },
    showMeta: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
    section: { ...typography.h3, color: colors.foreground, marginBottom: 12, marginTop: 8 },
    episode: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 16 },
    epCover: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.secondary },
    epInfo: { flex: 1, justifyContent: 'center' },
    epTitle: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    epMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
    epActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    badge: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    playIcon: { padding: 2 },
  });
}
