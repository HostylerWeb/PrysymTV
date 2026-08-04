import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { WatchEngagementRow } from '@/components/engagement/WatchEngagementRow';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { AdPreroll } from '@/components/ads/AdPreroll';
import { Button } from '@/components/ui/Button';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVideoDetail } from '@/hooks/api/useVideoDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useWatchAnalytics } from '@/hooks/useWatchAnalytics';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { toggleVideoLike, toggleVideoSave } from '@/lib/api/videos';
import { bumpLikeCount } from '@/utils/engagement-count';
import type { ThemeColors } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatDuration, formatViewCount } from '@/utils/format-media';

export default function MovieScreen() {
  const styles = useThemedStyles(createStyles);
  const isFocused = useIsFocused();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requireAuth, user } = useMockAuth();
  useBackNavigation('/(tabs)/movies');
  const movieQuery = useVideoDetail(id);
  const movie = movieQuery.data;

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ seconds: 0, duration: 0 });

  React.useEffect(() => {
    if (!movie) return;
    setLiked(!!movie.liked);
    setSaved(!!movie.saved);
    setLikesCount(movie.likesCount ?? 0);
  }, [movie]);

  usePlaybackProgress(
    'video',
    movie?.id,
    progress.seconds,
    progress.duration || movie?.durationSeconds || 0,
    playing && isFocused && Boolean(movie?.playbackSource),
  );

  useWatchAnalytics(movie?.id, {
    creatorId: movie?.creator?.id,
    viewerUserId: user?.id,
    enabled: playing && isFocused && Boolean(movie?.playbackSource),
  });

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  const startWatch = () => setPrerollOpen(true);
  const finishPreroll = () => {
    setPrerollOpen(false);
    setPlaying(true);
  };

  if (movieQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (movieQuery.isError || !movie) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={movieQuery.error} onRetry={() => void movieQuery.refetch()} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title="Movie" showSearch={false} showNotifications={false} backFallback="/(tabs)/movies" />
        </View>
        {playing ? (
          <PlayerShell
            title={movie.title}
            thumbnailUrl={movie.thumbnailUrl}
            playbackUrl={movie.playbackSource}
            subtitle={`${movie.releaseYear ?? ''} · ${movie.ageRating ?? ''}`}
            showCast
            nativeControls={false}
            enableQualityMenu
            enableFullscreen
            enablePlayerChrome
            paused={!isFocused}
            onProgress={onProgress}
          />
        ) : prerollOpen ? (
          <View style={styles.prerollSlot}>
            <PlayerShell
              title={movie.title}
              thumbnailUrl={movie.thumbnailUrl}
              playbackUrl={movie.playbackSource}
              subtitle={`${movie.releaseYear ?? ''} · ${movie.ageRating ?? ''}`}
              showCast
              posterOnly
              hideMeta
            />
            <AdPreroll
              inline
              visible={prerollOpen}
              onComplete={finishPreroll}
              videoId={movie.id}
              creatorId={movie.creator.id}
            />
          </View>
        ) : (
          <PlayerShell
            title={movie.title}
            thumbnailUrl={movie.thumbnailUrl}
            playbackUrl={movie.playbackSource}
            subtitle={`${movie.releaseYear ?? ''} · ${movie.ageRating ?? ''}`}
            showCast
            posterOnly
            onPlayPress={startWatch}
          />
        )}
        <View style={styles.body}>
          <Text style={styles.meta}>
            {movie.releaseYear} · {formatDuration(movie.durationSeconds)} · {movie.ageRating ?? 'NR'} · {movie.category ?? 'Film'}
          </Text>
          <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>
            {movie.description ?? movie.tagline ?? 'Streaming on Prysym TV.'}
          </Text>
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
          </Pressable>
          {!playing ? <Button label="Watch now" onPress={startWatch} /> : null}
          <WatchEngagementRow
            liked={liked}
            disliked={false}
            saved={saved}
            likesCount={likesCount}
            onLike={() => requireAuth(async () => {
              const wasLiked = liked;
              try {
                const res = await toggleVideoLike(movie.id);
                setLiked(res.liked);
                setLikesCount((c) =>
                  res.likesCount != null ? res.likesCount : bumpLikeCount(c, wasLiked, res.liked),
                );
              } catch {
                setLiked(wasLiked);
              }
            })}
            onSave={() => requireAuth(async () => {
              const prev = saved;
              try {
                const res = await toggleVideoSave(movie.id);
                setSaved(res.saved);
              } catch {
                setSaved(prev);
              }
            })}
            onPlaylist={() => requireAuth(() => setPlaylistOpen(true))}
            onGift={() => requireAuth(() => setGiftOpen(true))}
            onShare={() => setShareOpen(true)}
          />
          <Button label="Comments" variant="outline" onPress={() => setCommentsOpen(true)} />
          <Pressable style={styles.reportLink} onPress={() => setReportOpen(true)}>
            <Text style={styles.reportText}>Report</Text>
          </Pressable>
        </View>
      </ScrollView>

      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={movie.creator.id}
        receiverName={movie.creator.displayName ?? movie.creator.username}
        videoId={movie.id}
      />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={movie.title}
        url={buildShareUrl(`/movie/${movie.id}`)}
        targetId={movie.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="video" targetId={movie.id} />
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} videoId={movie.id} videoTitle={movie.title} />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={movie.title}
        itemType="video"
        itemId={movie.id}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  prerollSlot: { position: 'relative', width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  pad: { paddingHorizontal: 16 },
  body: { padding: 16, gap: 12 },
  meta: { color: colors.mutedForeground, fontSize: 13 },
  desc: { color: colors.foreground, lineHeight: 20 },
  readMore: { color: colors.primary, fontWeight: '600' },
  reportLink: { marginTop: 8 },
  reportText: { color: colors.mutedForeground, fontSize: 13 },
  });
