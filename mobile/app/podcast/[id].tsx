import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { AudioPlayer } from '@/components/podcasts/AudioPlayer';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { AdPreroll } from '@/components/ads/AdPreroll';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { usePodcastEpisodeDetail } from '@/hooks/api/usePodcastEpisodeDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { usePodcastPlayer } from '@/context/PodcastPlayerContext';
import { useWatchAnalytics } from '@/hooks/useWatchAnalytics';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { parseResumeSeconds } from '@/lib/continue-watching-nav';
import {
  togglePodcastLike,
  togglePodcastSave,
} from '@/lib/api/podcasts';
import { resolveAvatarUrl } from '@/lib/media-url';
import { radius } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatDuration, formatViewCount } from '@/utils/format-media';

export default function PodcastEpisodeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { id, autoplay, t } = useLocalSearchParams<{ id: string; autoplay?: string; t?: string }>();
  const router = useRouter();
  const { stop } = usePodcastPlayer();
  useBackNavigation('/(tabs)/podcasts');
  const { requireAuth, user } = useMockAuth();
  const epQuery = usePodcastEpisodeDetail(id);
  const ep = epQuery.data;
  const resumeSeconds = parseResumeSeconds(t);

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(resumeSeconds);

  React.useEffect(() => {
    stop();
  }, [id, stop]);

  React.useEffect(() => {
    if (autoplay !== '1' || !ep?.playbackSource || started) return;
    setPrerollOpen(true);
  }, [autoplay, ep?.id, ep?.playbackSource, started]);

  React.useEffect(() => {
    if (!ep) return;
    setLiked(!!ep.liked);
    setSaved(!!ep.saved);
  }, [ep]);

  usePlaybackProgress(
    'podcast_episode',
    ep?.id,
    progressSeconds,
    ep?.durationSeconds ?? 0,
    started,
  );

  useWatchAnalytics(ep?.id, {
    creatorId: ep?.creator?.id,
    viewerUserId: user?.id,
    enabled: started,
  });

  const onAudioProgress = useCallback((seconds: number) => {
    setProgressSeconds(seconds);
  }, []);

  const startPlayback = () => {
    if (!started) setPrerollOpen(true);
  };

  if (epQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (epQuery.isError || !ep) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={epQuery.error} onRetry={() => void epQuery.refetch()} />
      </View>
    );
  }

  const hostSlug = ep.creator?.username ?? 'creator';
  const hostName = ep.creator?.displayName ?? hostSlug;
  const coverUri = ep.coverUrl ?? ep.show?.coverUrl ?? null;

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader
            showBack
            showSearch={false}
            showNotifications={false}
            backFallback="/(tabs)/podcasts"
          />
          <Pressable onPress={() => router.push('/(tabs)/podcasts')}>
            <Text style={styles.backLink}>‹ Back to Podcasts</Text>
          </Pressable>
        </View>

        {coverUri ? (
          <View style={styles.artWrap}>
            <Image source={{ uri: coverUri }} style={styles.art} contentFit="cover" accessibilityLabel={ep.title} />
            <View style={styles.artBadge}>
              <Text style={styles.artBadgeText}>{ep.mediaType === 'video' ? 'Video podcast' : 'Audio podcast'}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.metaBlock}>
          <Text style={styles.epTitle}>{ep.title}</Text>
          <Text style={styles.epSub}>
            {ep.show?.title ?? 'Podcast'} · {formatDuration(ep.durationSeconds)}
            {ep.playsCount != null ? ` · ${formatViewCount(ep.playsCount)} plays` : ''}
          </Text>
        </View>

        {ep.mediaType === 'video' && ep.playbackSource ? (
          started ? (
            <PlayerShell
              title={ep.title}
              thumbnailUrl={coverUri}
              playbackUrl={ep.playbackSource}
              subtitle={ep.show?.title ?? 'Podcast'}
              showCast
              nativeControls={false}
              enableQualityMenu
              enableFullscreen
              enablePlayerChrome
              initialPositionSeconds={resumeSeconds}
            />
          ) : prerollOpen ? (
            <View style={styles.prerollSlot}>
              <PlayerShell
                title={ep.title}
                thumbnailUrl={coverUri}
                playbackUrl={ep.playbackSource}
                subtitle={ep.show?.title ?? 'Podcast'}
                showCast
                posterOnly
              />
              <AdPreroll
                inline
                visible={prerollOpen}
                onComplete={() => {
                  setPrerollOpen(false);
                  setStarted(true);
                }}
                videoId={ep.id}
                creatorId={ep.creator?.id}
              />
            </View>
          ) : (
            <Pressable style={styles.playBtn} onPress={startPlayback}>
              <Ionicons name="play" size={22} color={colors.primaryForeground} />
              <Text style={styles.playText}>Play episode</Text>
            </Pressable>
          )
        ) : ep.playbackSource && started ? (
          <AudioPlayer
            source={ep.playbackSource}
            title={ep.title}
            durationSeconds={ep.durationSeconds}
            onProgress={onAudioProgress}
            autoPlay
            initialPositionSeconds={resumeSeconds}
          />
        ) : !started ? (
          <Pressable style={styles.playBtn} onPress={startPlayback}>
            <Ionicons name="play" size={22} color={colors.primaryForeground} />
            <Text style={styles.playText}>Play episode</Text>
          </Pressable>
        ) : null}

        <Text style={styles.epDesc}>{ep.description ?? `Listen to ${ep.title} on Prysym Podcasts.`}</Text>

        {ep.creator ? (
          <Pressable style={styles.hostCard} onPress={() => router.push(`/creator/${hostSlug}`)}>
            <Image
              source={{ uri: resolveAvatarUrl(ep.creator.avatarUrl, hostSlug) }}
              style={styles.hostAvatar}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{hostName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}

        <View style={styles.iconRow}>
          <IconBtn icon={liked ? 'heart' : 'heart-outline'} label="Like" active={liked} onPress={() => requireAuth(async () => {
            const res = await togglePodcastLike(ep.id);
            setLiked(res.liked);
          })} />
          <IconBtn icon={saved ? 'bookmark' : 'bookmark-outline'} label="Save" active={saved} onPress={() => requireAuth(async () => {
            const res = await togglePodcastSave(ep.id);
            setSaved(res.saved);
          })} />
          <IconBtn icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
          <IconBtn icon="list-outline" label="Playlist" onPress={() => requireAuth(() => setPlaylistOpen(true))} />
          <IconBtn icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
          <IconBtn icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
        </View>
      </ScrollView>
      {ep.mediaType !== 'video' ? (
        <AdPreroll
          visible={prerollOpen}
          onComplete={() => {
            setPrerollOpen(false);
            setStarted(true);
          }}
          videoId={ep.id}
          creatorId={ep.creator?.id}
        />
      ) : null}
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={ep.title}
        url={buildShareUrl(`/podcast/${ep.id}`)}
        targetId={ep.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="podcast_episode" targetId={ep.id} />
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={ep.creator?.id}
        receiverName={hostName}
        videoId={ep.id}
      />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={ep.title}
        itemType="podcast_episode"
        itemId={ep.id}
      />
    </>
  );
}

function IconBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable style={[styles.iconBtn, active && styles.iconBtnActive]} onPress={onPress} accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.foreground} />
      <Text style={[styles.iconLabel, active && styles.iconLabelActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    prerollSlot: { position: 'relative', width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
    center: { alignItems: 'center', justifyContent: 'center' },
    pad: { paddingHorizontal: 16 },
    backLink: { color: colors.primary, fontWeight: '600', marginBottom: 8 },
    artWrap: {
      marginHorizontal: 16,
      marginBottom: 16,
      alignSelf: 'center',
      width: 220,
      aspectRatio: 1,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    art: { width: '100%', height: '100%' },
    artBadge: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    artBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    metaBlock: { paddingHorizontal: 16, marginBottom: 12, alignItems: 'center' },
    epTitle: { color: colors.foreground, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    epSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 6, textAlign: 'center' },
    epDesc: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, paddingHorizontal: 16, marginBottom: 12 },
    hostCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hostAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted },
    hostLabel: { color: colors.mutedForeground, fontSize: 11 },
    hostName: { color: colors.foreground, fontWeight: '700' },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      marginBottom: 16,
      gap: 2,
    },
    iconBtn: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 2,
      borderRadius: radius.md,
      minWidth: 0,
    },
    iconBtnActive: { backgroundColor: colors.primary + '15' },
    iconLabel: { color: colors.foreground, fontSize: 9, fontWeight: '600', textAlign: 'center' },
    iconLabelActive: { color: colors.primary },
    playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    playText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 15 },
  });
}
