import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { WatchEngagementRow } from '@/components/engagement/WatchEngagementRow';
import { WatchCommentsPanel } from '@/components/engagement/WatchCommentsPanel';
import { AdBanner } from '@/components/ads/AdBanner';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { getMockVideo, mockComments, mockVideos } from '@/mocks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatDuration, formatViewCount } from '@/utils/format-media';

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const video = getMockVideo(id ?? '') ?? getMockVideo('video-1')!;
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(!!video.liked);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(!!video.saved);
  const [following, setFollowing] = useState(!!video.isFollowing);
  const [likesCount, setLikesCount] = useState(video.likesCount ?? 0);

  const upNext = mockVideos.filter((v) => v.id !== video.id).slice(0, 3);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
        </View>
        <PlayerShell
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
          subtitle={`${video.channel} · ${formatViewCount(video.viewsCount ?? 0)} views`}
          showCast
          hideMeta
          onShare={() => setShareOpen(true)}
          onReport={() => requireAuth(() => setReportOpen(true))}
        />
        <AdBanner />
        <View style={styles.metaBlock}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.viewsLine}>
            {formatViewCount(video.viewsCount ?? 0)} views · Recently
          </Text>
        </View>
        <WatchEngagementRow
          liked={liked}
          disliked={disliked}
          saved={saved}
          likesCount={likesCount}
          onLike={() => requireAuth(() => {
            const next = !liked;
            setLiked(next);
            if (disliked) setDisliked(false);
            setLikesCount((n) => n + (next ? 1 : -1));
          })}
          onDislike={() => requireAuth(() => {
            setDisliked(!disliked);
            if (liked) {
              setLiked(false);
              setLikesCount((n) => Math.max(0, n - 1));
            }
          })}
          onSave={() => requireAuth(() => setSaved(!saved))}
          onPlaylist={() => requireAuth(() => setPlaylistOpen(true))}
          onGift={() => requireAuth(() => setGiftOpen(true))}
          onShare={() => setShareOpen(true)}
        />
        <View style={styles.creatorRow}>
          <Pressable style={styles.creatorInfo} onPress={() => router.push(`/creator/${video.channelSlug}`)}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarLetter}>{video.channel[0]}</Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{video.channel}</Text>
              <Text style={styles.creatorHandle}>Creator</Text>
            </View>
          </Pressable>
          <Button
            label={following ? 'Following' : 'Follow'}
            variant={following ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => requireAuth(() => setFollowing(!following))}
          />
        </View>
        <Text style={styles.description}>
          {video.tagline ?? `Watch ${video.title} from @${video.channelSlug} on Prysym TV.`}
        </Text>
        <Text style={styles.immersiveHint}>Tip: rotate your device for a wider view (coming soon)</Text>
        <WatchCommentsPanel
          count={video.commentsCount ?? mockComments.length}
          videoTitle={video.title}
          thumbnailUrl={video.thumbnailUrl}
        />
        <View style={styles.upNextSection}>
          <Text style={styles.section}>Up next</Text>
          {upNext.map((v) => (
            <Pressable key={v.id} style={styles.upNext} onPress={() => router.push(`/watch/${v.id}`)}>
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
      </ScrollView>
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={video.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
      <AddToPlaylistSheet visible={playlistOpen} onClose={() => setPlaylistOpen(false)} contentTitle={video.title} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarLetter: { color: colors.primary, fontWeight: '800' },
  creatorName: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
  creatorHandle: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  description: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
  immersiveHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: spacing.page,
    marginBottom: spacing.sm,
  },
  upNextSection: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  section: { color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  upNext: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  upNextThumbWrap: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
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
