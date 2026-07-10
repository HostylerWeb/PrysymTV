import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  onShare?: () => void;
  onReport?: () => void;
  hideMeta?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  onProgress?: (seconds: number, duration: number) => void;
};

export function PlayerShell({
  title,
  thumbnailUrl,
  playbackUrl,
  subtitle,
  badge,
  showCast = false,
  onShare,
  onReport,
  hideMeta = false,
  contentFit = 'contain',
  onProgress,
}: Props) {
  const showTopActions = showCast || onShare || onReport;

  return (
    <View style={styles.wrap}>
      {playbackUrl ? (
        <HlsPlayer
          source={playbackUrl}
          contentFit={contentFit}
          onProgress={onProgress}
        />
      ) : (
        <>
          <Image source={{ uri: thumbnailUrl ?? '' }} style={styles.video} contentFit="cover" />
          <View style={styles.overlay}>
            <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
            <Text style={styles.mock}>Video unavailable</Text>
          </View>
        </>
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
          {showCast && playbackUrl ? <CastMediaButton variant="on-video" mediaUrl={playbackUrl} /> : null}
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
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.secondary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    height: undefined,
    aspectRatio: 16 / 9,
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
