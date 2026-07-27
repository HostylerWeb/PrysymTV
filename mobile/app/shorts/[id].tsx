import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVideoDetail } from '@/hooks/api/useVideoDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useWatchAnalytics } from '@/hooks/useWatchAnalytics';
import { followUser, unfollowUser } from '@/lib/api/users';
import { toggleVideoLike, toggleVideoSave } from '@/lib/api/videos';
import { colors, withAlpha } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';
import { bumpLikeCount } from '@/utils/engagement-count';

const { height } = Dimensions.get('window');

export default function ShortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { requireAuth } = useMockAuth();
  const shortQuery = useVideoDetail(id);
  const short = shortQuery.data;

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [progress, setProgress] = useState({ seconds: 0, duration: 0 });

  React.useEffect(() => {
    if (!short) return;
    setLiked(!!short.liked);
    setSaved(!!short.saved);
    setFollowing(!!short.isFollowing);
    setLikesCount(short.likesCount ?? 0);
  }, [short]);

  usePlaybackProgress(
    'video',
    short?.id,
    progress.seconds,
    progress.duration || short?.durationSeconds || 0,
    isFocused && Boolean(short?.playbackSource),
  );

  useWatchAnalytics(isFocused ? short?.id : undefined, {
    creatorId: short?.creator?.id,
  });

  const onProgress = useCallback((seconds: number, duration: number) => {
    setProgress({ seconds, duration });
  }, []);

  if (shortQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center, { height: height - insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (shortQuery.isError || !short) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={shortQuery.error} onRetry={() => void shortQuery.refetch()} />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.screen, { height: height - insets.bottom }]}>
        <Image source={{ uri: short.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        {short.playbackSource && isFocused ? (
          <HlsPlayer
            source={short.playbackSource}
            contentFit="cover"
            fill
            nativeControls={false}
            seekOnTap
            tapToToggle={false}
            paused={!isFocused}
            onProgress={onProgress}
          />
        ) : null}
        <View style={styles.overlay} pointerEvents="none" />
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.onVideo} />
        </Pressable>
        <View style={[styles.sideActions, { bottom: 140 }]}>
          <Action
            icon={liked ? 'heart' : 'heart-outline'}
            label={formatViewCount(likesCount)}
            onPress={() => requireAuth(async () => {
              const prevLiked = liked;
              const prevCount = likesCount;
              try {
                const res = await toggleVideoLike(short.id);
                setLiked(res.liked);
                setLikesCount(
                  res.likesCount != null
                    ? res.likesCount
                    : bumpLikeCount(prevCount, prevLiked, res.liked),
                );
              } catch {
                setLiked(prevLiked);
                setLikesCount(prevCount);
              }
            })}
          />
          <Action icon="chatbubble-outline" label="Comments" onPress={() => requireAuth(() => setCommentsOpen(true))} />
          <Action icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
          <Action
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? 'Saved' : 'Save'}
            onPress={() => requireAuth(async () => {
              const prev = saved;
              try {
                const res = await toggleVideoSave(short.id);
                setSaved(res.saved);
              } catch {
                setSaved(prev);
              }
            })}
          />
          <Action icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
          <Action icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
        </View>
        <View style={[styles.bottomMeta, { paddingBottom: 24 + insets.bottom }]}>
          <Pressable onPress={() => router.push(`/creator/${short.creator.username}`)}>
            <Text style={styles.channel}>@{short.creator.username}</Text>
          </Pressable>
          <Text style={styles.caption}>{short.title}</Text>
          <Pressable
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={() => requireAuth(async () => {
              const prev = following;
              try {
                if (following) {
                  await unfollowUser(short.creator.username);
                  setFollowing(false);
                } else {
                  await followUser(short.creator.username);
                  setFollowing(true);
                }
              } catch {
                setFollowing(prev);
              }
            })}
          >
            <Text style={styles.followText}>{following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>
      </View>
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} videoId={short.id} videoTitle={short.title} />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={short.title}
        url={buildShareUrl(`/shorts/${short.id}`)}
        targetId={short.id}
      />
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={short.creator.id}
        receiverName={short.creator.displayName ?? short.creator.username}
        videoId={short.id}
      />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={short.title}
        itemType="video"
        itemId={short.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="video" targetId={short.id} />
    </>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Ionicons name={icon} size={28} color={colors.onVideo} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.videoBackground, justifyContent: 'flex-end' },
  center: { alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrimLight },
  back: { position: 'absolute', left: 12, padding: 8, zIndex: 3 },
  sideActions: { position: 'absolute', right: 12, alignItems: 'center', gap: 20, zIndex: 3 },
  action: { alignItems: 'center', gap: 4 },
  actionLabel: { color: colors.onVideo, fontSize: 11, fontWeight: '600' },
  bottomMeta: { paddingHorizontal: 16, paddingRight: 72, zIndex: 3 },
  channel: { color: colors.onVideo, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  caption: { color: colors.onVideo, fontSize: 14, marginBottom: 8 },
  followBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  followingBtn: { backgroundColor: withAlpha(colors.onVideo, 0.2) },
  followText: { color: colors.onVideo, fontSize: 13, fontWeight: '700' },
});
