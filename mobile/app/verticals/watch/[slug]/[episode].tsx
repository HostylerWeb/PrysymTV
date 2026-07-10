import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { VerticalEpisodeAdGate } from '@/components/ads/VerticalEpisodeAdGate';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { GiftModal } from '@/components/modals/GiftModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
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

const { height } = Dimensions.get('window');

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
  const playbackQuery = useVerticalEpisodePlayback(slug, epNum);
  const data = playbackQuery.data;

  const [gateOpen, setGateOpen] = useState(true);
  const [gateDismissed, setGateDismissed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seriesSaved, setSeriesSaved] = useState(false);
  const [progress, setProgress] = useState({ seconds: 0, duration: 0 });

  React.useEffect(() => {
    if (!data) return;
    setLiked(!!data.episode.liked);
    setSaved(!!data.episode.saved);
    setSeriesSaved(!!data.series.saved);
    setGateOpen(true);
    setGateDismissed(false);
  }, [data?.episode.id]);

  usePlaybackProgress(
    'vertical_episode',
    data?.episode.id,
    progress.seconds,
    progress.duration || data?.episode.durationSeconds || 0,
    isFocused && gateDismissed && Boolean(data?.playbackSource),
  );

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  if (playbackQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center, { height }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (playbackQuery.isError || !data) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={playbackQuery.error} onRetry={() => void playbackQuery.refetch()} />
      </View>
    );
  }

  const hasNext = Boolean(data.nextEpisode);
  const posterUri = data.series.posterUrl ?? '';

  return (
    <>
      <View style={styles.screen}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.videoBackground }]} />
        )}
        {!gateDismissed ? (
          <View style={[styles.loadingScrim, StyleSheet.absoluteFill]} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.onVideo} />
          </View>
        ) : null}
        {data.playbackSource && isFocused ? (
          <View style={styles.playerLayer}>
            <HlsPlayer
              source={data.playbackSource}
              contentFit="cover"
              fill
              posterUrl={posterUri || null}
              nativeControls={false}
              tapToToggle
              enableQualityMenu
              enableFullscreen
              controlsPlacement="top"
              controlsTopInset={insets.top + 104}
              paused={!gateDismissed || !isFocused}
              autoPlay={gateDismissed}
              onProgress={onProgress}
            />
          </View>
        ) : null}
        {gateDismissed && !data.playbackSource ? (
          <View style={[styles.center, StyleSheet.absoluteFill]}>
            <Text style={styles.errorText}>Playback is not available for this episode.</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.back, { top: insets.top + 8 }]}
          onPress={() => navigateBack(router, `/verticals/${data.series.slug}`)}
        >
          <Ionicons name="chevron-back" size={28} color={colors.onVideo} />
        </Pressable>
        {!gateDismissed && gateOpen ? (
          <VerticalEpisodeAdGate
            visible={gateOpen}
            videoId={data.episode.id}
            creatorId={data.series.creatorId ?? undefined}
            onComplete={() => { setGateOpen(false); setGateDismissed(true); }}
          />
        ) : null}
        {gateDismissed ? (
          <View style={[styles.topActions, { top: insets.top + 48 }]} pointerEvents="box-none">
            <Pressable
              style={styles.headerBtn}
              onPress={() => setShareOpen(true)}
              accessibilityLabel="Share"
            >
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
              accessibilityLabel="Save series"
            >
              <Ionicons name={seriesSaved ? 'albums' : 'albums-outline'} size={22} color={colors.onVideo} />
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
        <View style={[styles.meta, { bottom: insets.bottom + 32 }]} pointerEvents="box-none">
          <Text style={styles.title}>{data.series.title}</Text>
          <Text style={styles.ep}>Episode {data.episode.episodeNumber}: {data.episode.title}</Text>
          {data.episode.cliffhanger ? (
            <Text style={styles.cliff}>{data.episode.cliffhanger}</Text>
          ) : null}
          {hasNext && data.nextEpisode ? (
            <Button
              label={`Next: Ep ${data.nextEpisode.episodeNumber}`}
              variant="secondary"
              size="sm"
              onPress={() => router.replace(`/verticals/watch/${data.series.slug}/${data.nextEpisode!.episodeNumber}`)}
              style={{ marginTop: 8, alignSelf: 'flex-start' }}
            />
          ) : (
            <Text style={styles.hint}>You reached the latest episode</Text>
          )}
        </View>
      </View>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={`${data.series.title} Ep ${data.episode.episodeNumber}`} />
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
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    loadingScrim: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha('#000', 0.45),
      zIndex: 1,
    },
    errorText: { color: colors.onVideo, textAlign: 'center', paddingHorizontal: 24, fontSize: 15 },
    playerLayer: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
    back: { position: 'absolute', left: 12, zIndex: 4, padding: 8 },
    topActions: {
      position: 'absolute',
      right: 12,
      zIndex: 4,
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
      zIndex: 3,
    },
    title: { color: colors.onVideo, fontSize: 20, fontWeight: '800' },
    ep: { color: colors.onVideo, fontSize: 14, marginTop: 4 },
    cliff: { color: withAlpha(colors.onVideo, 0.8), fontSize: 13, marginTop: 6 },
    hint: { color: withAlpha(colors.onVideo, 0.7), marginTop: 8, fontSize: 13 },
  });
