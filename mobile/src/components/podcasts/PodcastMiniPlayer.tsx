import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CastMediaButton } from '@/components/video/CastMediaButton';
import { usePodcastPlayer } from '@/context/PodcastPlayerContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import type { ThemeColors } from '@/theme/tokens';
import { radius, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatDuration } from '@/utils/format-media';

function isVideoEpisode(ep: { mediaType: string; videoUrl?: string | null }) {
  return ep.mediaType === 'video' || !!ep.videoUrl?.trim();
}

export function PodcastMiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { episode, playing, progress, muted, togglePlay, toggleMute, stop, setProgress } =
    usePodcastPlayer();

  const isVideo = episode ? isVideoEpisode(episode) : false;
  const audioSource = !isVideo ? (episode?.audioUrl?.trim() ?? '') : '';
  const videoSource = isVideo ? (episode?.videoUrl?.trim() ?? '') : '';

  const audioPlayer = useAudioPlayer(audioSource || null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const videoPlayer = useVideoPlayer(
    videoSource ? { uri: videoSource, contentType: videoSource.includes('.m3u8') ? 'hls' : 'auto' } : null,
    (p) => {
      p.muted = muted;
    },
  );

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!episode || isVideo) return;
    if (!audioSource) return;
    if (playing) audioPlayer.play();
    else audioPlayer.pause();
  }, [episode?.id, playing, isVideo, audioSource, audioPlayer]);

  useEffect(() => {
    if (!episode || isVideo) return;
    audioPlayer.muted = muted;
  }, [muted, episode?.id, isVideo, audioPlayer]);

  useEffect(() => {
    if (!episode || !isVideo || !videoSource) return;
    videoPlayer.muted = muted;
    if (playing) videoPlayer.play();
    else videoPlayer.pause();
  }, [episode?.id, playing, isVideo, videoSource, muted, videoPlayer]);

  useEffect(() => {
    if (!episode || isVideo) return;
    const dur = episode.durationSeconds || audioStatus.duration || 0;
    if (dur <= 0 || audioStatus.currentTime == null) return;
    setProgress(Math.min(1, audioStatus.currentTime / dur));
  }, [audioStatus.currentTime, audioStatus.duration, episode, isVideo, setProgress]);

  useEffect(() => {
    if (!episode || !isVideo) return;
    const sub = videoPlayer.addListener('timeUpdate', ({ currentTime }) => {
      const dur = episode.durationSeconds || videoPlayer.duration || 0;
      if (dur > 0 && Number.isFinite(dur)) {
        setProgress(Math.min(1, currentTime / dur));
      }
    });
    return () => sub.remove();
  }, [episode, isVideo, videoPlayer, setProgress]);

  const elapsed = useMemo(() => {
    if (!episode) return 0;
    const dur = episode.durationSeconds || 0;
    return Math.floor(dur * progress);
  }, [episode, progress]);

  if (!episode) return null;

  const hasMedia = isVideo ? !!videoSource : !!audioSource;

  return (
    <View style={[styles.wrap, { bottom: tabInset + 8, marginBottom: insets.bottom > 0 ? 0 : 4 }]}>
      {isVideo && videoSource ? (
        <View style={styles.videoStage}>
          <VideoView player={videoPlayer} style={styles.video} contentFit="cover" nativeControls={false} />
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>Video</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.controlsRow}>
        <Pressable style={styles.main} onPress={() => router.push(`/podcast/${episode.id}`)}>
          <Image source={{ uri: episode.coverUrl ?? '' }} style={styles.cover} contentFit="cover" />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {episode.title}
            </Text>
            <Text style={styles.sub}>{episode.showTitle}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </View>
        </Pressable>

        <Pressable onPress={toggleMute} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color={colors.foreground} />
        </Pressable>
        <CastMediaButton variant="compact" />
        <Pressable
          onPress={hasMedia ? togglePlay : () => router.push(`/podcast/${episode.id}`)}
          hitSlop={8}
          style={styles.playBtn}
        >
          <Ionicons
            name={hasMedia && playing ? 'pause' : 'play'}
            size={22}
            color={colors.primaryForeground}
          />
        </Pressable>
        <Pressable onPress={stop} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="close" size={20} color={colors.mutedForeground} />
        </Pressable>
        <Text style={styles.time}>{formatDuration(elapsed)}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 12,
      right: 12,
      borderRadius: radius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 50,
      elevation: 8,
      overflow: 'hidden',
    },
    videoStage: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: colors.videoBackground,
      position: 'relative',
    },
    video: { width: '100%', height: '100%' },
    videoBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: withAlpha(colors.scrim, 0.75),
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    videoBadgeText: { color: colors.onVideo, fontSize: 10, fontWeight: '700' },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
    },
    main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    cover: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.secondary },
    meta: { flex: 1 },
    title: { color: colors.foreground, fontSize: 13, fontWeight: '700' },
    sub: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
    progressTrack: {
      height: 3,
      backgroundColor: colors.secondary,
      borderRadius: 2,
      marginTop: 6,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.primary },
    iconBtn: { padding: 4 },
    playBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    time: { position: 'absolute', right: 12, bottom: 4, color: colors.mutedForeground, fontSize: 9 },
  });
}
