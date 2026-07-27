import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { VerticalEpisodeAdGate } from '@/components/ads/VerticalEpisodeAdGate';
import { fetchServedAd, isValidServedAd, type ServedAd } from '@/lib/api/ads';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { GiftModal } from '@/components/modals/GiftModal';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { useVerticalSeriesDetail } from '@/hooks/api/useVerticalSeriesDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useWatchAnalytics } from '@/hooks/useWatchAnalytics';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { navigateBack } from '@/lib/navigation';
import {
  toggleVerticalEpisodeLike,
  toggleVerticalEpisodeSave,
  toggleVerticalSeriesSave,
} from '@/lib/api/verticals';
import { radius, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

const { height: screenHeight } = Dimensions.get('window');

type EpisodeRow = {
  id: string;
  episodeNumber: number;
  title: string;
};

type EpisodeCellProps = {
  slug: string;
  episode: EpisodeRow;
  active: boolean;
  immersive: boolean;
  screenFocused: boolean;
  posterUri: string;
  onFullscreenChange: (next: boolean) => void;
  onGateDismissed: (episodeId: string) => void;
  gateDismissed: boolean;
};

function VerticalEpisodeCell({
  slug,
  episode,
  active,
  immersive,
  screenFocused,
  posterUri,
  onFullscreenChange,
  onGateDismissed,
  gateDismissed,
}: EpisodeCellProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowAds();
  const { isPlacementEnabled } = usePublicAdsConfig();
  const { user } = useMockAuth();
  const playbackQuery = useVerticalEpisodePlayback(slug, episode.episodeNumber);
  const data = playbackQuery.data;
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAd, setGateAd] = useState<ServedAd | null>(null);
  const [progress, setProgress] = useState({ seconds: 0, duration: 0 });

  React.useEffect(() => {
    if (!active) return;
    setGateOpen(false);
    setGateAd(null);
    if (!shouldShow || !isPlacementEnabled('vertical_episode')) {
      onGateDismissed(episode.id);
      return;
    }
    void fetchServedAd('vertical_episode', { peek: true }).then((peekAd) => {
      if (!isValidServedAd(peekAd)) {
        onGateDismissed(episode.id);
        return;
      }
      setGateAd(peekAd);
      setGateOpen(true);
    });
  }, [active, episode.id, shouldShow, isPlacementEnabled, onGateDismissed]);

  usePlaybackProgress(
    'vertical_episode',
    data?.episode.id,
    progress.seconds,
    progress.duration || data?.episode.durationSeconds || 0,
    active && screenFocused && gateDismissed && Boolean(data?.playbackSource),
  );

  useWatchAnalytics(data?.episode.id, {
    creatorId: data?.series.creatorId ?? undefined,
    viewerUserId: user?.id,
    enabled: active && screenFocused && gateDismissed && Boolean(data?.playbackSource),
  });

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  if (playbackQuery.isLoading) {
    return (
      <View style={[styles.cell, styles.center, { backgroundColor: colors.videoBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (playbackQuery.isError || !data) {
    return (
      <View style={[styles.cell, styles.center, { backgroundColor: colors.videoBackground }]}>
        <Text style={{ color: colors.onVideo }}>Could not load episode {episode.episodeNumber}</Text>
      </View>
    );
  }

  const showPlayer = Boolean(data.playbackSource) && screenFocused;

  return (
    <View style={styles.cell}>
      {posterUri ? (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.videoBackground }]} />
      )}
      {!gateDismissed && active ? (
        <View style={[styles.loadingScrim, StyleSheet.absoluteFill]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.onVideo} />
        </View>
      ) : null}
      {showPlayer ? (
        <View style={styles.playerLayer}>
          <HlsPlayer
            source={data.playbackSource!}
            contentFit="cover"
            fill
            posterUrl={posterUri || null}
            nativeControls={false}
            tapToToggle
            enablePlayerChrome
            enableQualityMenu
            enableFullscreen
            fullscreenPresentation="inline"
            externalFullscreen={immersive && active}
            onFullscreenChange={active ? onFullscreenChange : undefined}
            controlsPlacement="top"
            controlsTopInset={insets.top + (immersive ? 56 : 104)}
            paused={!gateDismissed || !active || !screenFocused}
            autoPlay={gateDismissed && active}
            onProgress={onProgress}
          />
        </View>
      ) : null}
      {active && gateOpen && gateAd ? (
        <VerticalEpisodeAdGate
          visible={gateOpen}
          servedAd={gateAd}
          videoId={data.episode.id}
          creatorId={data.series.creatorId ?? undefined}
          onComplete={() => {
            setGateOpen(false);
            onGateDismissed(data.episode.id);
          }}
        />
      ) : null}
    </View>
  );
}

export default function VerticalWatchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { slug, episode } = useLocalSearchParams<{ slug: string; episode: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { requireAuth } = useMockAuth();
  useBackNavigation(`/verticals/${slug ?? ''}`);
  const epNum = parseInt(episode ?? '1', 10) || 1;

  const seriesQuery = useVerticalSeriesDetail(slug);
  const episodes = seriesQuery.data?.episodes ?? [];
  const initialIndex = Math.max(0, episodes.findIndex((e) => e.episodeNumber === epNum));

  const [activeEpNum, setActiveEpNum] = useState(epNum);
  const [immersive, setImmersive] = useState(false);
  const [gateDismissedMap, setGateDismissedMap] = useState<Record<string, boolean>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seriesSaved, setSeriesSaved] = useState(false);

  const playbackQuery = useVerticalEpisodePlayback(slug, activeEpNum);
  const data = playbackQuery.data;
  const listRef = useRef<FlatList<EpisodeRow>>(null);

  React.useEffect(() => {
    if (!data) return;
    setLiked(!!data.episode.liked);
    setSaved(!!data.episode.saved);
    setSeriesSaved(!!data.series.saved);
  }, [data?.episode.id]);

  React.useEffect(() => {
    if (immersive) {
      void ScreenOrientation.unlockAsync().catch(() => {});
    } else {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [immersive]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]?.item as EpisodeRow | undefined;
      if (!first) return;
      setActiveEpNum(first.episodeNumber);
      if (first.episodeNumber !== epNum) {
        router.replace(`/verticals/watch/${slug}/${first.episodeNumber}` as never);
      }
    },
  ).current;

  const getItemLayout = useCallback(
    (_: ArrayLike<EpisodeRow> | null | undefined, index: number) => ({
      length: screenHeight,
      offset: screenHeight * index,
      index,
    }),
    [],
  );

  const onGateDismissed = useCallback((episodeId: string) => {
    setGateDismissedMap((prev) => ({ ...prev, [episodeId]: true }));
  }, []);

  const onFullscreenChange = useCallback((next: boolean) => {
    setImmersive(next);
  }, []);

  if (seriesQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center, { height: screenHeight }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (seriesQuery.isError || episodes.length === 0) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={seriesQuery.error} onRetry={() => void seriesQuery.refetch()} />
      </View>
    );
  }

  const posterUri = seriesQuery.data?.posterUrl ?? '';
  const activeEpisode = episodes.find((e) => e.episodeNumber === activeEpNum);
  const activeGateDismissed = activeEpisode
    ? Boolean(gateDismissedMap[activeEpisode.id])
    : false;
  const hasNext = Boolean(data?.nextEpisode);
  const showChrome = !immersive;

  return (
    <>
      <StatusBar hidden={immersive} />
      <View style={styles.screen}>
        <FlatList
          ref={listRef}
          data={episodes}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToInterval={screenHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
          onScrollToIndexFailed={() => {}}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 85 }}
          scrollEnabled={isFocused}
          renderItem={({ item }) => (
            <VerticalEpisodeCell
              slug={slug!}
              episode={item}
              active={item.episodeNumber === activeEpNum}
              immersive={immersive}
              screenFocused={isFocused}
              posterUri={posterUri}
              onFullscreenChange={onFullscreenChange}
              onGateDismissed={onGateDismissed}
              gateDismissed={Boolean(gateDismissedMap[item.id])}
            />
          )}
        />

        {showChrome ? (
          <Pressable
            style={[styles.back, { top: insets.top + 8 }]}
            onPress={() => navigateBack(router, `/verticals/${slug}`)}
          >
            <Ionicons name="chevron-back" size={28} color={colors.onVideo} />
          </Pressable>
        ) : null}

        {showChrome && activeGateDismissed && data ? (
          <View style={[styles.topActions, { top: insets.top + 48 }]} pointerEvents="box-none">
            <Pressable style={styles.headerBtn} onPress={() => setShareOpen(true)} accessibilityLabel="Share">
              <Ionicons name="share-outline" size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(() => setGiftOpen(true))}
              accessibilityLabel="Gift"
            >
              <Ionicons name="gift-outline" size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const prev = liked;
                try {
                  const res = await toggleVerticalEpisodeLike(data.episode.id);
                  setLiked(res.liked);
                } catch {
                  setLiked(prev);
                }
              })}
              accessibilityLabel="Like"
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const prev = saved;
                try {
                  const res = await toggleVerticalEpisodeSave(data.episode.id);
                  setSaved(res.saved);
                } catch {
                  setSaved(prev);
                }
              })}
              accessibilityLabel="Save episode"
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const prev = seriesSaved;
                try {
                  const res = await toggleVerticalSeriesSave(data.series.id);
                  setSeriesSaved(res.saved);
                } catch {
                  setSeriesSaved(prev);
                }
              })}
              accessibilityLabel="Save series to library"
            >
              <Ionicons name={seriesSaved ? 'library' : 'library-outline'} size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(() => setReportOpen(true))}
              accessibilityLabel="Report"
            >
              <Ionicons name="flag-outline" size={22} color={colors.onVideo} />
            </Pressable>
          </View>
        ) : null}

        {showChrome && activeGateDismissed && data ? (
          <View style={[styles.meta, { bottom: insets.bottom + 32 }]} pointerEvents="box-none">
            <Text style={styles.title}>{data.series.title}</Text>
            <Text style={styles.ep}>
              Episode {data.episode.episodeNumber}: {data.episode.title}
            </Text>
            {data.episode.cliffhanger ? (
              <Text style={styles.cliff}>{data.episode.cliffhanger}</Text>
            ) : null}
            {hasNext && data.nextEpisode ? (
              <Text style={styles.hint}>Swipe up for Ep {data.nextEpisode.episodeNumber}</Text>
            ) : (
              <Text style={styles.hint}>You reached the latest episode</Text>
            )}
          </View>
        ) : null}
      </View>

      {data ? (
        <>
          <ShareModal
            visible={shareOpen}
            onClose={() => setShareOpen(false)}
            title={`${data.series.title} Ep ${data.episode.episodeNumber}`}
            url={buildShareUrl(`/verticals/watch/${slug}/${data.episode.episodeNumber}`)}
            targetId={data.episode.id}
          />
          <GiftModal
            visible={giftOpen}
            onClose={() => setGiftOpen(false)}
            receiverId={data.series.creatorId ?? undefined}
            receiverName={data.series.title}
            videoId={data.episode.id}
          />
          <ReportModal
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            targetType="vertical_episode"
            targetId={data.episode.id}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '100%',
    height: screenHeight,
    backgroundColor: '#000',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingScrim: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.45),
    zIndex: 1,
  },
  playerLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    back: { position: 'absolute', left: 12, zIndex: 20, padding: 8 },
    topActions: {
      position: 'absolute',
      right: 12,
      zIndex: 15,
      flexDirection: 'row',
      gap: 8,
    },
    headerBtn: {
      padding: 8,
      borderRadius: radius.full,
      backgroundColor: withAlpha(colors.videoBackground, 0.5),
    },
    meta: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 12,
    },
    title: { color: colors.onVideo, fontSize: 20, fontWeight: '800' },
    ep: { color: colors.onVideo, fontSize: 14, marginTop: 4 },
    cliff: { color: withAlpha(colors.onVideo, 0.8), fontSize: 13, marginTop: 6 },
    hint: { color: withAlpha(colors.onVideo, 0.7), marginTop: 8, fontSize: 13 },
  });
