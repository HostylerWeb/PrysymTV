import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { VerticalEpisodeAdGate } from '@/components/ads/VerticalEpisodeAdGate';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { Button } from '@/components/ui/Button';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { GiftModal } from '@/components/modals/GiftModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
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
  const { requireAuth } = useMockAuth();
  const epNum = parseInt(episode ?? '1', 10) || 1;
  const playbackQuery = useVerticalEpisodePlayback(slug, epNum);
  const data = playbackQuery.data;

  const [gateOpen, setGateOpen] = useState(true);
  const [gateDismissed, setGateDismissed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
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
    gateDismissed && Boolean(data?.playbackSource),
  );

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  if (playbackQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
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

  return (
    <>
      <View style={styles.screen}>
        {gateDismissed && data.playbackSource ? (
          <HlsPlayer
            source={data.playbackSource}
            contentFit="cover"
            fill
            onProgress={onProgress}
          />
        ) : null}
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.push(`/verticals/${data.series.slug}`)}>
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
          <View style={[styles.topActions, { top: insets.top + 48 }]}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const res = await toggleVerticalEpisodeLike(data.episode.id);
                setLiked(res.liked);
              })}
            >
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const res = await toggleVerticalEpisodeSave(data.episode.id);
                setSaved(res.saved);
              })}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.onVideo} />
            </Pressable>
            <Pressable
              style={styles.headerBtn}
              onPress={() => requireAuth(async () => {
                const res = await toggleVerticalSeriesSave(data.series.id);
                setSeriesSaved(res.saved);
              })}
            >
              <Ionicons name={seriesSaved ? 'albums' : 'albums-outline'} size={22} color={colors.onVideo} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.meta}>
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
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={`${data.series.title} Ep ${data.episode.episodeNumber}`} />
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={data.series.creatorId ?? undefined}
        receiverName={data.series.title}
        videoId={data.episode.id}
      />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={`${data.series.title} Ep ${data.episode.episodeNumber}`}
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
  meta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, zIndex: 3, backgroundColor: withAlpha(colors.background, 0.85) },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
  ep: { color: colors.primary, marginTop: 4, fontWeight: '600' },
  cliff: { color: colors.primary, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  hint: { color: colors.mutedForeground, fontSize: 12, marginTop: 8 },
  });
