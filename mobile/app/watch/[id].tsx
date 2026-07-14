import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { WatchEngagementRow } from '@/components/engagement/WatchEngagementRow';
import { WatchCommentsPanel } from '@/components/engagement/WatchCommentsPanel';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { AdBanner } from '@/components/ads/AdBanner';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVideoDetail } from '@/hooks/api/useVideoDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { fetchFeedTrending } from '@/lib/api/feed';
import { mapVideoCard } from '@/lib/api/map-content';
import { followUser, unfollowUser } from '@/lib/api/users';
import {
  toggleVideoDislike,
  toggleVideoLike,
  toggleVideoSave,
} from '@/lib/api/videos';
import { resolveAvatarUrl } from '@/lib/media-url';
import { spacing } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { bumpLikeCount } from '@/utils/engagement-count';
import { formatDuration, formatViewCount } from '@/utils/format-media';

export default function WatchScreen() {
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { requireAuth } = useMockAuth();
  useBackNavigation('/(tabs)/home');
  const videoQuery = useVideoDetail(id);
  const video = videoQuery.data;

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [progress, setProgress] = useState({ seconds: 0, duration: 0 });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  React.useEffect(() => {
    if (!video) return;
    setLiked(!!video.liked);
    setDisliked(!!video.disliked);
    setSaved(!!video.saved);
    setFollowing(!!video.isFollowing);
    setLikesCount(video.likesCount ?? 0);
  }, [video]);

  usePlaybackProgress(
    'video',
    video?.id,
    progress.seconds,
    progress.duration || video?.durationSeconds || 0,
    Boolean(video?.playbackSource) && isFocused,
  );

  const relatedQuery = useQuery({
    queryKey: ['feed', 'trending', 'related', id],
    queryFn: async () => {
      const data = await fetchFeedTrending(1, 12);
      return data.items.map(mapVideoCard).filter((v) => v.id !== id).slice(0, 4);
    },
    enabled: Boolean(id),
  });

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  if (videoQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (videoQuery.isError || !video) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={videoQuery.error} onRetry={() => void videoQuery.refetch()} />
      </View>
    );
  }

  const channel = video.creator.displayName ?? video.creator.username;

  return (
    <>
      <View style={styles.screen}>
        {!commentsOpen ? (
          <View style={styles.pad}>
            <AppHeader showBack showSearch={false} showNotifications={false} backFallback="/(tabs)/home" />
          </View>
        ) : null}
        <View style={commentsOpen ? { height: windowHeight * 0.32 } : undefined}>
          <PlayerShell
            title={video.title}
            thumbnailUrl={video.thumbnailUrl}
            playbackUrl={video.playbackSource}
            subtitle={`${channel} · ${formatViewCount(video.viewsCount ?? 0)} views`}
            showCast
            hideMeta
            nativeControls={false}
            enableQualityMenu
            enableFullscreen
            enablePlayerChrome
            paused={!isFocused}
            onProgress={onProgress}
            onShare={() => setShareOpen(true)}
            onReport={() => requireAuth(() => setReportOpen(true))}
          />
        </View>
        {commentsOpen ? (
          <WatchCommentsPanel
            layout="pinned"
            open
            onOpenChange={setCommentsOpen}
            videoId={video.id}
            count={video.commentsCount}
            videoTitle={video.title}
            thumbnailUrl={video.thumbnailUrl}
          />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <AdBanner />
            <View style={styles.metaBlock}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.viewsLine}>
                {formatViewCount(video.viewsCount ?? 0)} views
              </Text>
            </View>
            <WatchEngagementRow
              liked={liked}
              disliked={disliked}
              saved={saved}
              likesCount={likesCount}
              onLike={() => requireAuth(async () => {
                const wasLiked = liked;
                try {
                  const res = await toggleVideoLike(video.id);
                  setLiked(res.liked);
                  if (res.disliked) setDisliked(false);
                  setLikesCount((c) =>
                    res.likesCount != null ? res.likesCount : bumpLikeCount(c, wasLiked, res.liked),
                  );
                } catch {
                  setLiked(wasLiked);
                }
              })}
              onDislike={() => requireAuth(async () => {
                const res = await toggleVideoDislike(video.id);
                setDisliked(res.disliked);
                if (res.liked === false && liked) {
                  setLiked(false);
                  setLikesCount((n) => Math.max(0, n - 1));
                }
              })}
              onSave={() => requireAuth(async () => {
                const res = await toggleVideoSave(video.id);
                setSaved(res.saved);
              })}
              onPlaylist={() => requireAuth(() => setPlaylistOpen(true))}
              onGift={() => requireAuth(() => setGiftOpen(true))}
              onShare={() => setShareOpen(true)}
            />
            <View style={styles.creatorRow}>
              <Pressable
                style={styles.creatorInfo}
                onPress={() => router.push(`/creator/${video.creator.username}`)}
              >
                <Image
                  source={{ uri: resolveAvatarUrl(video.creator.avatarUrl, video.creator.username) }}
                  style={styles.creatorAvatarImg}
                />
                <View>
                  <Text style={styles.creatorName}>{channel}</Text>
                  <Text style={styles.creatorHandle}>@{video.creator.username}</Text>
                </View>
              </Pressable>
              <Button
                label={following ? 'Following' : 'Follow'}
                variant={following ? 'secondary' : 'primary'}
                size="sm"
                onPress={() => requireAuth(async () => {
                  if (following) {
                    await unfollowUser(video.creator.username);
                    setFollowing(false);
                  } else {
                    await followUser(video.creator.username);
                    setFollowing(true);
                  }
                })}
              />
            </View>
            <Text style={styles.description}>
              {video.description ?? video.tagline ?? `Watch ${video.title} on Prysym TV.`}
            </Text>
            <WatchCommentsPanel
              layout="pinned"
              open={false}
              onOpenChange={setCommentsOpen}
              videoId={video.id}
              count={video.commentsCount}
              videoTitle={video.title}
              thumbnailUrl={video.thumbnailUrl}
            />
            {(relatedQuery.data?.length ?? 0) > 0 && (
              <View style={styles.upNextSection}>
                <Text style={styles.section}>Up next</Text>
                {relatedQuery.data?.map((v) => (
                  <Pressable key={v.id} style={styles.upNext} onPress={() => router.replace(`/watch/${v.id}`)}>
                    <View style={styles.upNextThumbWrap}>
                      <Image source={{ uri: v.thumbnailUrl ?? '' }} style={styles.upNextThumb} contentFit="cover" />
                      {v.durationSeconds ? (
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{formatDuration(v.durationSeconds)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.upNextBody}>
                      <Text style={styles.upNextTitle} numberOfLines={2}>{v.title}</Text>
                      <Text style={styles.upNextMeta}>{v.channel} · {formatViewCount(v.viewsCount ?? 0)} views</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={video.creator.id}
        receiverName={video.creator.displayName ?? video.creator.username}
        videoId={video.id}
      />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={video.title}
        url={buildShareUrl(`/watch/${video.id}`)}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="video" targetId={video.id} />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={video.title}
        itemType="video"
        itemId={video.id}
      />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page },
  metaBlock: { paddingHorizontal: spacing.page, paddingTop: spacing.md },
  videoTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  viewsLine: { color: colors.mutedForeground, fontSize: 13, marginBottom: spacing.sm },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.page,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  creatorAvatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary },
  creatorName: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
  creatorHandle: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  description: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
  upNextSection: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  section: { color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  upNext: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  upNextThumbWrap: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  upNextThumb: { width: '100%', height: '100%' },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { color: colors.onVideo, fontSize: 10, fontWeight: '600' },
  upNextBody: { flex: 1, justifyContent: 'center', minWidth: 0 },
  upNextTitle: { color: colors.foreground, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  upNextMeta: { color: colors.mutedForeground, fontSize: 12 },
  });
