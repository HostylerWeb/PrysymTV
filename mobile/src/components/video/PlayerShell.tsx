import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CastMediaButton } from '@/components/video/CastMediaButton';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { colors, radius, withAlpha } from '@/theme/tokens';

type Props = {
  title: string;
  thumbnailUrl: string | null;
  playbackUrl?: string | null;
  subtitle?: string;
  badge?: string;
  showCast?: boolean;
  /** Poster-only state before playback starts (not an error). */
  posterOnly?: boolean;
  onPlayPress?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  hideMeta?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  onProgress?: (seconds: number, duration: number) => void;
  nativeControls?: boolean;
  enableQualityMenu?: boolean;
  enableFullscreen?: boolean;
  seekOnTap?: boolean;
  paused?: boolean;
};

export function PlayerShell({
  title,
  thumbnailUrl,
  playbackUrl,
  subtitle,
  badge,
  showCast = false,
  posterOnly = false,
  onPlayPress,
  onShare,
  onReport,
  hideMeta = false,
  contentFit = 'contain',
  onProgress,
  nativeControls = true,
  enableQualityMenu = false,
  enableFullscreen = false,
  seekOnTap = false,
  paused = false,
}: Props) {
  const showTopActions = showCast || onShare || onReport;
  const showPoster = posterOnly || !playbackUrl;

  return (
    <View style={styles.wrap}>
      {playbackUrl && !posterOnly ? (
        <HlsPlayer
          source={playbackUrl}
          contentFit={contentFit}
          onProgress={onProgress}
          nativeControls={nativeControls}
          enableQualityMenu={enableQualityMenu}
          enableFullscreen={enableFullscreen}
          seekOnTap={seekOnTap}
          tapToToggle={!nativeControls && !seekOnTap}
          paused={paused}
        />
      ) : (
        <Pressable style={styles.posterWrap} onPress={onPlayPress} disabled={!onPlayPress}>
          <Image source={{ uri: thumbnailUrl ?? '' }} style={styles.video} contentFit="cover" />
          <View style={styles.overlay}>
            {onPlayPress ? (
              <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
            ) : (
              <>
                <ActivityIndicator size="large" color={withAlpha(colors.onVideo, 0.9)} />
                {!posterOnly && !playbackUrl ? (
                  <Text style={styles.mock}>Video unavailable</Text>
                ) : null}
              </>
            )}
          </View>
        </Pressable>
      )}
      {showTopActions ? (
        <View style={styles.topActions}>
          {onReport ? (
            <Pressable style={styles.topBtn} onPress={onReport} accessibilityLabel="Report">
              <Ionicons name="flag-outline" size={18} color={colors.onVideo} />
            </Pressable>
          ) : null}
          {onShare ? (
            <Pressable style={styles.topBtn} onPress={onShare} accessibilityLabel="Share">
              <Ionicons name="share-outline" size={18} color={colors.onVideo} />
            </Pressable>
          ) : null}
          {showCast && playbackUrl && !posterOnly ? (
            <CastMediaButton variant="on-video" mediaUrl={playbackUrl} />
          ) : null}
        </View>
      ) : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {!hideMeta ? (
        <View style={styles.meta}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.videoBackground },
  posterWrap: { width: '100%', aspectRatio: 16 / 9 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.secondary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mock: { color: withAlpha(colors.onVideo, 0.6), fontSize: 12, marginTop: 8 },
  topActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha(colors.onVideo, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.live,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { color: colors.onVideo, fontSize: 10, fontWeight: '800' },
  meta: { padding: 16 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
});
