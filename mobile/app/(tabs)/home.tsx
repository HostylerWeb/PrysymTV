import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeTrendingRail } from '@/components/home/HomeTrendingRail';
import { HomeEditorialGrid } from '@/components/home/HomeEditorialGrid';
import { HomeDualSpotlight } from '@/components/home/HomeDualSpotlight';
import { CategoryTabs, type HomeCategory } from '@/components/home/CategoryTabs';
import { ContentRow } from '@/components/feed/ContentRow';
import { ContinueWatchingRow } from '@/components/feed/ContinueWatchingRow';
import { LiveStreamCard } from '@/components/feed/LiveStreamCard';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { HeroSkeleton, RowSkeleton } from '@/components/ui/ContentSkeleton';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { AdBanner } from '@/components/ads/AdBanner';
import { useMockAuth } from '@/context/MockAuthContext';
import { Image } from 'expo-image';
import { useHomeFeed } from '@/hooks/api/useHomeFeed';
import { useVerticalsList } from '@/hooks/api/useVerticalsList';
import { usePodcastsCatalog } from '@/hooks/api/usePodcastsCatalog';
import { flattenShortsPages, useShortsFeed } from '@/hooks/api/useShortsFeed';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import type { VideoCard } from '@/types/api';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { requireAuth } = useMockAuth();
  const [category, setCategory] = useState<HomeCategory>('all');
  const { trigger, flowHost } = useCreateFlow();
  const [refreshing, setRefreshing] = useState(false);

  const homeQuery = useHomeFeed();
  const verticalsQuery = useVerticalsList();
  const podcastsQuery = usePodcastsCatalog(1, 12);
  const shortsQuery = useShortsFeed(8);

  const feed = homeQuery.data;
  const verticals = verticalsQuery.data ?? [];
  const podcastEpisodes = podcastsQuery.data?.episodes ?? [];
  const shorts = flattenShortsPages(shortsQuery.data?.pages);

  const heroSlides = useMemo(() => {
    if (!feed) return [];
    const slides: Array<VideoCard & { reason: 'new_release' | 'trending' }> = [];
    if (feed.featuredMovie) {
      slides.push({
        ...feed.featuredMovie,
        reason: feed.heroMovieReason ?? 'trending',
      });
    }
    for (const movie of feed.movies.slice(0, 3)) {
      if (slides.some((s) => s.id === movie.id)) continue;
      slides.push({
        ...movie,
        reason: slides.length === 0 ? 'new_release' : 'trending',
      });
    }
    if (slides.length === 0) {
      return feed.newReleases.slice(0, 4).map((m, i) => ({
        ...m,
        reason: (i === 0 ? 'new_release' : 'trending') as 'new_release' | 'trending',
      }));
    }
    return slides.slice(0, 4);
  }, [feed]);

  const featuredLive = feed?.featuredLive ?? feed?.liveNow[0] ?? null;
  const liveStreams = feed?.liveNow ?? [];
  const trendingVideos = feed?.trending ?? [];
  const movies = feed?.movies ?? [];

  const showLive = category === 'all' || category === 'live';
  const showMovies = category === 'all' || category === 'movies';
  const showVideos = category === 'all' || category === 'videos' || category === 'trending';
  const showSeries = category === 'all' || category === 'series';

  const isLoading = homeQuery.isLoading && !feed;
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      homeQuery.refetch(),
      verticalsQuery.refetch(),
      podcastsQuery.refetch(),
      shortsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <AppHeader showCreate onCreatePress={() => requireAuth(() => trigger('menu'))} />

        {isLoading ? (
          <>
            <HeroSkeleton />
            <RowSkeleton />
            <RowSkeleton itemWidth={100} itemHeight={150} />
          </>
        ) : homeQuery.isError ? (
          <FeedQueryState
            isError
            error={homeQuery.error}
            onRetry={() => void homeQuery.refetch()}
          />
        ) : (
          <>
            {heroSlides.length > 0 ? <HomeHero slides={heroSlides} /> : null}
            {featuredLive ? <LiveStreamCard stream={featuredLive} featured /> : null}
            <Pressable
              style={[
                styles.promoCard,
                {
                  backgroundColor: withAlpha(colors.primary, 0.1),
                  borderColor: withAlpha(colors.primary, 0.35),
                },
              ]}
              onPress={() => router.push('/premium')}
            >
              <ThemedText variant="eyebrow" primary>
                Prysym memberships
              </ThemedText>
              <ThemedText variant="body" style={{ marginTop: 4 }}>
                Go ad-free with Premium, shape the platform with Insider, or join a creator&apos;s channel.
              </ThemedText>
              <View style={styles.promoLinks}>
                <Pressable onPress={() => router.push('/premium')}>
                  <ThemedText variant="caption" primary style={{ fontWeight: '700' }}>
                    Premium
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/insider')}>
                  <ThemedText variant="caption" primary style={{ fontWeight: '700' }}>
                    Insider
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/impact')}>
                  <ThemedText variant="caption" primary style={{ fontWeight: '700' }}>
                    Community Impact
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
            <CategoryTabs active={category} onChange={setCategory} />
            <ContinueWatchingRow items={feed?.continueWatching ?? []} />

            {category === 'all' && (
              <>
                {trendingVideos.length > 0 ? <HomeTrendingRail items={trendingVideos} /> : null}
                {trendingVideos[0] && verticals[0] ? (
                  <HomeEditorialGrid spotlight={trendingVideos[0]} verticals={verticals} />
                ) : null}
                {(shorts.length > 0 || podcastEpisodes.length > 0) && (
                  <HomeDualSpotlight shorts={shorts} podcasts={podcastEpisodes} />
                )}
              </>
            )}

            <AdBanner />

            {showLive && liveStreams.length > 0 && (
              <ContentRow title="Live now" actionLabel="View all" onAction={() => router.push('/live')} bordered={false}>
                {liveStreams.map((s) => (
                  <Pressable key={s.id} onPress={() => router.push(`/live/${s.id}`)} style={{ width: 200 }}>
                    <LiveStreamCard stream={s} />
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {showSeries && verticals.length > 0 && (
              <ContentRow title="Micro-dramas & series" actionLabel="View all" onAction={() => router.push('/(tabs)/verticals')}>
                {verticals.slice(0, 5).map((s) => (
                  <Pressable key={s.slug} onPress={() => router.push(`/verticals/${s.slug}`)}>
                    <Image source={{ uri: s.posterUrl ?? '' }} style={styles.poster} contentFit="cover" />
                    <ThemedText variant="caption" style={styles.posterLabel} numberOfLines={1}>
                      {s.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {category === 'all' && shorts.length > 0 && (
              <ContentRow title="Shorts" actionLabel="View all" onAction={() => router.push('/(tabs)/shorts')}>
                {shorts.slice(0, 5).map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => router.push({ pathname: '/(tabs)/shorts', params: { start: v.id } })}
                  >
                    <Image source={{ uri: v.thumbnailUrl ?? '' }} style={styles.shortThumb} contentFit="cover" />
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {category === 'all' && podcastEpisodes.length > 0 && (
              <ContentRow title="Podcasts" actionLabel="View all" onAction={() => router.push('/(tabs)/podcasts')}>
                {podcastEpisodes.slice(0, 5).map((ep) => (
                  <Pressable key={ep.id} onPress={() => router.push(`/podcast/${ep.id}`)} style={styles.podCard}>
                    <Image source={{ uri: ep.coverUrl ?? '' }} style={styles.podCover} contentFit="cover" />
                    <ThemedText variant="caption" style={styles.posterLabel} numberOfLines={2}>
                      {ep.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {showVideos && trendingVideos.length > 0 && (
              <ContentRow
                title={category === 'trending' ? 'Trending' : 'Videos'}
                actionLabel="View all"
                onAction={() => router.push('/(tabs)/videos')}
              >
                {trendingVideos.slice(0, 6).map((v) => (
                  <View key={v.id} style={{ width: 200 }}>
                    <VideoCardTile video={v} variant="grid" />
                  </View>
                ))}
              </ContentRow>
            )}

            {showMovies && movies.length > 0 && (
              <>
                <ContentRow title="New releases">
                  {movies.slice(0, 4).map((m) => (
                    <VideoCardTile key={m.id} video={m} variant="poster" />
                  ))}
                </ContentRow>
                <ContentRow title="Top movies" actionLabel="View all" onAction={() => router.push('/(tabs)/movies')}>
                  {movies.slice(0, 8).map((m) => (
                    <VideoCardTile key={m.id} video={m} variant="poster" />
                  ))}
                </ContentRow>
              </>
            )}

            {category === 'all' && trendingVideos.length > 2 && (
              <ContentRow title="Recommended">
                {trendingVideos.slice(2, 6).map((v) => (
                  <View key={v.id} style={{ width: 200 }}>
                    <VideoCardTile video={v} variant="grid" />
                  </View>
                ))}
              </ContentRow>
            )}
          </>
        )}

        <PageFooter />
      </Screen>
      {flowHost}
    </>
  );
}

const styles = StyleSheet.create({
  promoCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  promoLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  shortThumb: {
    width: 100,
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
  },
  posterLabel: { marginTop: 6, width: 100 },
  podCard: { width: 120 },
  podCover: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
  },
});
