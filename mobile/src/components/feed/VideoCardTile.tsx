import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { radius, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatDuration, formatViewCount } from '@/utils/format-media';
import { resolveAvatarUrl } from '@/lib/media-url';
import type { VideoCard } from '@/types/api';

type Props = {
  video: VideoCard;
  variant?: 'grid' | 'row' | 'poster' | 'posterGrid';
  width?: number;
  onPress?: () => void;
};

export function VideoCardTile({ video, variant = 'grid', width, onPress }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createVideoCardStyles);
  const { width: screenWidth } = useWindowDimensions();

  const handlePress = onPress ?? (() => {
    if (video.type === 'movie') router.push(`/movie/${video.id}`);
    else if (video.type === 'short') {
      router.push({ pathname: '/(tabs)/shorts', params: { start: video.id } });
    }
    else router.push(`/watch/${video.id}`);
  });

  const posterWidth = width ?? Math.floor((screenWidth - 32 - 24) / 3);

  if (variant === 'poster' || variant === 'posterGrid') {
    return (
      <Pressable style={[styles.posterCard, { width: posterWidth }]} onPress={handlePress}>
        <View style={[styles.posterWrap, { width: posterWidth }]}>
          <Image source={{ uri: video.thumbnailUrl ?? '' }} style={styles.posterImg} contentFit="cover" />
          {video.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.posterTitle} numberOfLines={1}>{video.title}</Text>
        <Text style={styles.meta}>
          {video.releaseYear ?? ''}{video.viewsCount != null ? ` · ${formatViewCount(video.viewsCount)}` : ''}
        </Text>
      </Pressable>
    );
  }

  if (variant === 'row') {
    return (
      <Pressable style={styles.rowCard} onPress={handlePress}>
        <View style={styles.rowThumbWrap}>
          <Image source={{ uri: video.thumbnailUrl ?? '' }} style={styles.rowThumb} contentFit="cover" />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
          </View>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.meta}>{video.channel}</Text>
          {video.viewsCount != null && (
            <Text style={styles.meta}>{formatViewCount(video.viewsCount)} views</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.gridCard} onPress={handlePress}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: video.thumbnailUrl ?? '' }} style={styles.thumb} contentFit="cover" />
        <View style={styles.thumbGrad} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
        </View>
        {video.isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {video.isLive && video.isPaid ? (
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>VIP · {video.entryCoinCost?.toLocaleString() ?? '—'}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.infoRow}>
        <Image
          source={{
            uri: resolveAvatarUrl(video.channelAvatar, video.channelSlug ?? video.channel ?? 'creator'),
          }}
          style={styles.channelAvatar}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {video.channel}
            {video.viewsCount != null ? ` · ${formatViewCount(video.viewsCount)} views` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Horizontal trending movie card (16:9 with rank). */
export function TrendingMovieCard({
  video,
  rank,
  onPress,
}: {
  video: VideoCard;
  rank: number;
  onPress?: () => void;
}) {
  const router = useRouter();
  const styles = useThemedStyles(createVideoCardStyles);
  return (
    <Pressable
      style={styles.trendingCard}
      onPress={onPress ?? (() => router.push(`/movie/${video.id}`))}
    >
      <View style={styles.trendingThumb}>
        <Image source={{ uri: video.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.trendingGrad} />
        <Text style={styles.rank}>#{rank}</Text>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingTitle} numberOfLines={1}>{video.title}</Text>
          <Text style={styles.trendingSub}>
            {formatViewCount(video.viewsCount ?? 0)} views · {formatViewCount(video.likesCount ?? 0)} likes
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Small new-release poster for horizontal row. */
export function NewReleaseCard({ video, onPress }: { video: VideoCard; onPress?: () => void }) {
  const router = useRouter();
  const styles = useThemedStyles(createVideoCardStyles);
  return (
    <Pressable
      style={styles.newReleaseCard}
      onPress={onPress ?? (() => router.push(`/movie/${video.id}`))}
    >
      <View style={styles.newReleasePoster}>
        <Image source={{ uri: video.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
        <View style={styles.viewsChip}>
          <Text style={styles.viewsChipText}>{formatViewCount(video.viewsCount ?? 0)}</Text>
        </View>
      </View>
      <Text style={styles.posterTitle} numberOfLines={1}>{video.title}</Text>
      <Text style={styles.meta}>{video.releaseYear}</Text>
    </Pressable>
  );
}

function createVideoCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gridCard: { width: '100%', marginBottom: 32 },
    thumbWrap: { position: 'relative', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted },
    thumb: { width: '100%', aspectRatio: 16 / 9 },
    thumbGrad: { ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(colors.videoBackground, 0.15) },
    trendingGrad: { ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(colors.videoBackground, 0.45) },
    durationBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: colors.background + 'CC',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    durationText: { color: colors.foreground, fontSize: 11, fontWeight: '600' },
    liveBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryForeground },
    liveText: { color: colors.primaryForeground, fontSize: 10, fontWeight: '800' },
    vipBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#f59e0b',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    vipText: { color: '#000', fontSize: 10, fontWeight: '800' },
    infoRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    channelAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.muted,
    },
    info: { flex: 1, gap: 2 },
    title: { color: colors.foreground, fontSize: 14, fontWeight: '600', lineHeight: 18 },
    meta: { color: colors.mutedForeground, fontSize: 12 },
    rowCard: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    rowThumbWrap: { width: 168, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted },
    rowThumb: { width: 168, aspectRatio: 16 / 9 },
    rowInfo: { flex: 1, justifyContent: 'center', gap: 4 },
    posterCard: { marginBottom: 12 },
    posterWrap: { aspectRatio: 2 / 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted },
    posterImg: { width: '100%', height: '100%' },
    posterTitle: { color: colors.foreground, fontSize: 12, fontWeight: '600', marginTop: 6 },
    newBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    newBadgeText: { color: colors.primaryForeground, fontSize: 10, fontWeight: '800' },
    trendingCard: { width: 260 },
    trendingThumb: { aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted },
    rank: { position: 'absolute', top: 8, left: 8, fontSize: 36, fontWeight: '900', color: withAlpha(colors.onVideo, 0.3) },
    trendingMeta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
    trendingTitle: { color: colors.onVideo, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    trendingSub: { color: colors.onVideoSoft, fontSize: 11 },
    newReleaseCard: { width: 130 },
    newReleasePoster: { aspectRatio: 2 / 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted },
    viewsChip: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.background + 'CC',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    viewsChipText: { color: colors.foreground, fontSize: 10, fontWeight: '600' },
  });
}
