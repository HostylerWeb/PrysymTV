import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ContentRow } from '@/components/tv/ContentRow';
import { ContentCard } from '@/components/tv/ContentCard';
import { ContinueWatchingCard } from '@/components/tv/ContinueWatchingCard';
import { useHomeFeed } from '@/hooks/api/useHomeFeed';
import { useContentServices } from '@/hooks/api/useContentServices';
import { useVerticalsList } from '@/hooks/api/useVerticalsList';
import { usePodcastsCatalog } from '@/hooks/api/usePodcastsCatalog';
import { flattenShortsPages, useShortsFeed } from '@/hooks/api/useShortsFeed';
import { useOpenShort, useOpenWatch, prefetchWatchItem } from '@/hooks/useOpenWatch';
import { continueWatchingPath } from '@/lib/tv-routes';
import { colors, spacing, typography } from '@/theme/tokens';
import type { ContinueWatchingItem, LiveStream, VideoCard } from '@/types/api';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openWatch = useOpenWatch();
  const openShort = useOpenShort();
  const { isEnabled } = useContentServices();
  const { data, isLoading, error } = useHomeFeed();
  const verticalsQuery = useVerticalsList(isEnabled('verticals'));
  const podcastsQuery = usePodcastsCatalog(1, 12, isEnabled('podcasts'));
  const shortsQuery = useShortsFeed(12, isEnabled('shorts'));
  const shorts = flattenShortsPages(shortsQuery.data?.pages);

  const openContinue = (item: ContinueWatchingItem) => {
    if (item.contentType === 'video') {
      prefetchWatchItem(queryClient, {
        id: item.contentId,
        thumbnailUrl: item.thumbnailUrl,
      });
    }
    const route = continueWatchingPath(item);
    router.push({
      pathname: route.pathname as never,
      params: route.params as never,
    });
  };

  const openLive = (stream: LiveStream) => {
    router.push({ pathname: '/live/[id]', params: { id: stream.id } });
  };

  const liveItems: VideoCard[] = (data?.liveNow ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    thumbnailUrl: s.thumbnailUrl,
    durationSeconds: 0,
    type: 'video',
    channel: s.streamer,
    channelSlug: s.streamerSlug,
  }));

  const verticalCards: VideoCard[] = (verticalsQuery.data ?? []).slice(0, 12).map((s) => ({
    id: s.slug,
    title: s.title,
    thumbnailUrl: s.posterUrl,
    durationSeconds: 0,
    type: 'video',
    channel: s.genre ?? 'Vertical',
    channelSlug: s.slug,
  }));

  const podcastCards: VideoCard[] = (podcastsQuery.data?.episodes ?? []).slice(0, 12).map((ep) => ({
    id: ep.id,
    title: ep.title,
    thumbnailUrl: ep.coverUrl,
    durationSeconds: ep.durationSeconds,
    type: 'video',
    channel: ep.showTitle,
    channelSlug: '',
  }));

  const shortCards: VideoCard[] = shorts.slice(0, 12);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.hero}>Welcome to PrysymTV</Text>
      <Text style={styles.tagline}>Watch everything Prysym offers — on your big screen</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.error}>Could not load home feed.</Text>
      ) : (
        <>
          {data?.featuredLive ? (
            <View style={styles.featured}>
              <Text style={styles.featuredLabel}>Featured live</Text>
              <ContentCard
                title={data.featuredLive.title}
                thumbnailUrl={data.featuredLive.thumbnailUrl}
                subtitle={data.featuredLive.streamer}
                hasTVPreferredFocus
                onPress={() => openLive(data.featuredLive!)}
              />
            </View>
          ) : null}

          {data?.continueWatching.length ? (
            <View style={styles.section}>
              <Text style={styles.rowTitle}>Continue watching</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {data.continueWatching.map((item, index) => (
                  <ContinueWatchingCard
                    key={`${item.contentType}-${item.contentId}`}
                    item={item}
                    hasTVPreferredFocus={!data?.featuredLive && index === 0}
                    onPress={() => openContinue(item)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <ContentRow
            title="Live now"
            items={liveItems}
            onItemPress={(item) =>
              openLive({
                id: item.id,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                viewerCount: 0,
                category: 'Live',
                streamer: item.channel ?? '',
                streamerSlug: item.channelSlug ?? '',
                avatarUrl: null,
              })
            }
          />
          <ContentRow title="Trending videos" items={isEnabled('videos') ? (data?.trending ?? []) : []} onItemPress={openWatch} />
          <ContentRow title="New releases" items={isEnabled('movies') ? (data?.newReleases ?? []) : []} onItemPress={openWatch} />
          {isEnabled('movies') ? (
            <ContentRow title="Movies" items={data?.movies ?? []} onItemPress={openWatch} />
          ) : null}
        </>
      )}

      {isEnabled('shorts') && shortCards.length ? (
        <ContentRow
          title="Shorts"
          items={shortCards}
          aspectRatio={9 / 16}
          onItemPress={openShort}
        />
      ) : null}

      {isEnabled('verticals') && verticalCards.length ? (
        <View style={styles.section}>
          <Text style={styles.rowTitle}>Vertical series</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {verticalCards.map((item, index) => (
              <ContentCard
                key={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                subtitle={item.channel}
                aspectRatio={9 / 16}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/verticals/[slug]',
                    params: { slug: item.id },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {isEnabled('podcasts') && podcastCards.length ? (
        <ContentRow title="Podcasts" items={podcastCards} onItemPress={(item) =>
          router.push({ pathname: '/podcast/[id]', params: { id: item.id } })
        } />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingRight: spacing.lg,
  },
  hero: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  tagline: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featured: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featuredLabel: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  rowTitle: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  center: { padding: spacing.xl },
  error: {
    color: '#ff6b6b',
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
});
