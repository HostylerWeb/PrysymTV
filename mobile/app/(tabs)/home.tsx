import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { AdBanner } from '@/components/ads/AdBanner';
import { useMockAuth } from '@/context/MockAuthContext';
import { Image } from 'expo-image';
import {
  mockContinueWatching,
  mockLiveStreams,
  mockMovies,
  mockPodcastEpisodes,
  mockShorts,
  mockVerticals,
  mockVideos,
} from '@/mocks';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const [category, setCategory] = useState<HomeCategory>('all');
  const { trigger, flowHost } = useCreateFlow();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const showLive = category === 'all' || category === 'live';
  const showMovies = category === 'all' || category === 'movies';
  const showVideos = category === 'all' || category === 'videos' || category === 'trending';
  const showSeries = category === 'all' || category === 'series';

  const heroSlides = mockMovies.slice(0, 4).map((m, i) => ({
    ...m,
    reason: (i === 0 ? 'new_release' : 'trending') as 'new_release' | 'trending',
  }));

  return (
    <>
      <Screen>
        <AppHeader showCreate onCreatePress={() => requireAuth(() => trigger('menu'))} />

        {loading ? (
          <>
            <HeroSkeleton />
            <RowSkeleton />
            <RowSkeleton itemWidth={100} itemHeight={150} />
          </>
        ) : (
          <>
            <HomeHero slides={heroSlides} />
            {mockLiveStreams[0] && <LiveStreamCard stream={mockLiveStreams[0]} featured />}
            <CategoryTabs active={category} onChange={setCategory} />
            <ContinueWatchingRow items={mockContinueWatching} />

            {category === 'all' && (
              <>
                <HomeTrendingRail items={mockVideos} />
                <HomeEditorialGrid spotlight={mockVideos[0]} verticals={mockVerticals} />
                <HomeDualSpotlight shorts={mockShorts} podcasts={mockPodcastEpisodes} />
              </>
            )}

            <AdBanner />

            {showLive && (
              <ContentRow title="Live now" actionLabel="View all" onAction={() => router.push('/live')} bordered={false}>
                {mockLiveStreams.map((s) => (
                  <Pressable key={s.id} onPress={() => router.push(`/live/${s.id}`)} style={{ width: 200 }}>
                    <LiveStreamCard stream={s} />
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {showSeries && (
              <ContentRow title="Micro-dramas & series" actionLabel="View all" onAction={() => router.push('/(tabs)/verticals')}>
                {mockVerticals.slice(0, 5).map((s) => (
                  <Pressable key={s.slug} onPress={() => router.push(`/verticals/${s.slug}`)}>
                    <Image source={{ uri: s.posterUrl ?? '' }} style={styles.poster} contentFit="cover" />
                    <ThemedText variant="caption" style={styles.posterLabel} numberOfLines={1}>
                      {s.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {category === 'all' && (
              <ContentRow title="Shorts" actionLabel="View all" onAction={() => router.push('/(tabs)/shorts')}>
                {mockShorts.slice(0, 5).map((v) => (
                  <Pressable key={v.id} onPress={() => router.push('/(tabs)/shorts')}>
                    <Image source={{ uri: v.thumbnailUrl ?? '' }} style={styles.shortThumb} contentFit="cover" />
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {category === 'all' && (
              <ContentRow title="Podcasts" actionLabel="View all" onAction={() => router.push('/(tabs)/podcasts')}>
                {mockPodcastEpisodes.slice(0, 5).map((ep) => (
                  <Pressable key={ep.id} onPress={() => router.push(`/podcast/${ep.id}`)} style={styles.podCard}>
                    <Image source={{ uri: ep.coverUrl ?? '' }} style={styles.podCover} contentFit="cover" />
                    <ThemedText variant="caption" style={styles.posterLabel} numberOfLines={2}>
                      {ep.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </ContentRow>
            )}

            {showVideos && (
              <ContentRow
                title={category === 'trending' ? 'Trending' : 'Videos'}
                actionLabel="View all"
                onAction={() => router.push('/(tabs)/videos')}
              >
                {mockVideos.slice(0, 6).map((v) => (
                  <View key={v.id} style={{ width: 200 }}>
                    <VideoCardTile video={v} variant="grid" />
                  </View>
                ))}
              </ContentRow>
            )}

            {showMovies && (
              <>
                <ContentRow title="New releases">
                  {mockMovies.slice(0, 4).map((m) => (
                    <VideoCardTile key={m.id} video={m} variant="poster" />
                  ))}
                </ContentRow>
                <ContentRow title="Top movies" actionLabel="View all" onAction={() => router.push('/(tabs)/movies')}>
                  {mockMovies.slice(4, 8).map((m) => (
                    <VideoCardTile key={m.id} video={m} variant="poster" />
                  ))}
                </ContentRow>
              </>
            )}

            {category === 'all' && (
              <ContentRow title="Recommended">
                {mockVideos.slice(2, 6).map((v) => (
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
