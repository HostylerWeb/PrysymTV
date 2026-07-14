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
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { usePodcastEpisodeDetail } from '@/hooks/api/usePodcastEpisodeDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useBackNavigation } from '@/hooks/useBackNavigation';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  useBackNavigation('/(tabs)/podcasts');
  const { requireAuth } = useMockAuth();
  const epQuery = usePodcastEpisodeDetail(id);
  const ep = epQuery.data;

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);

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
        {ep.mediaType === 'video' && ep.playbackSource ? (
          started ? (
            <PlayerShell
              title={ep.title}
              thumbnailUrl={ep.coverUrl}
              playbackUrl={ep.playbackSource}
              subtitle={ep.show?.title ?? 'Podcast'}
              showCast
              nativeControls={false}
              enableQualityMenu
              enableFullscreen
              enablePlayerChrome
            />
          ) : (
            <View style={styles.audio}>
              <Text style={styles.audioTitle}>{ep.title}</Text>
              <Text style={styles.audioSub}>
                {ep.show?.title ?? 'Podcast'} · {formatDuration(ep.durationSeconds)}
                {ep.playsCount != null ? ` · ${formatViewCount(ep.playsCount)} plays` : ''}
              </Text>
              <Pressable style={styles.playBtn} onPress={startPlayback}>
                <Text style={styles.playText}>Play</Text>
              </Pressable>
            </View>
          )
        ) : ep.playbackSource && started ? (
          <AudioPlayer
            source={ep.playbackSource}
            title={ep.title}
            durationSeconds={ep.durationSeconds}
            onProgress={onAudioProgress}
            autoPlay
          />
        ) : (
          <View style={styles.audio}>
            <Text style={styles.audioTitle}>{ep.title}</Text>
            <Text style={styles.audioSub}>
              {ep.show?.title ?? 'Podcast'} · {formatDuration(ep.durationSeconds)}
              {ep.playsCount != null ? ` · ${formatViewCount(ep.playsCount)} plays` : ''}
            </Text>
            <Pressable style={styles.playBtn} onPress={startPlayback}>
              <Text style={styles.playText}>{started ? 'Playing' : 'Play'}</Text>
            </Pressable>
          </View>
        )}
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
      <AdPreroll
        visible={prerollOpen}
        onComplete={() => { setPrerollOpen(false); setStarted(true); }}
        videoId={ep.id}
        creatorId={ep.creator?.id}
      />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={ep.title} />
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
    <Pressable style={[styles.iconBtn, active && styles.iconBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.foreground} />
      <Text style={[styles.iconLabel, active && styles.iconLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    pad: { paddingHorizontal: 16 },
    backLink: { color: colors.primary, fontWeight: '600', marginBottom: 8 },
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
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    iconBtn: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      minWidth: 64,
    },
    iconBtnActive: { backgroundColor: colors.primary + '22' },
    iconLabel: { color: colors.foreground, fontSize: 10, fontWeight: '600' },
    iconLabelActive: { color: colors.primary },
    bodyBtn: { marginHorizontal: 16, marginBottom: 16 },
    audio: { padding: 24, alignItems: 'center', gap: 12 },
    audioTitle: { color: colors.foreground, fontSize: 20, fontWeight: '700', textAlign: 'center' },
    audioSub: { color: colors.mutedForeground, fontSize: 14 },
    playBtn: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    playText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 15 },
  });
}
