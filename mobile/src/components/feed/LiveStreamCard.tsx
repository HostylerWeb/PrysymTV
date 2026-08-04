import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, withAlpha } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';
import { resolveAvatarUrl } from '@/lib/media-url';
import type { LiveStream } from '@/types/api';

export function LiveStreamCard({ stream, featured }: { stream: LiveStream; featured?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      style={[styles.card, featured && styles.featured]}
      onPress={() => router.push(`/live/${stream.id}`)}
    >
      <Image
        source={{
          uri: stream.thumbnailUrl
            ? stream.thumbnailUrl
            : resolveAvatarUrl(stream.avatarUrl, stream.streamerSlug ?? stream.streamer),
        }}
        style={styles.thumb}
        contentFit={stream.thumbnailUrl ? 'cover' : 'contain'}
      />
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      {stream.isPaid ? (
        <View style={styles.vipBadge}>
          <Ionicons name="logo-bitcoin" size={10} color="#000" />
          <Text style={styles.vipText}>VIP · {stream.entryCoinCost?.toLocaleString() ?? '—'}</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={styles.bodyRow}>
          <Image
            source={{ uri: resolveAvatarUrl(stream.avatarUrl, stream.streamerSlug ?? stream.streamer) }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.bodyText}>
            <Text style={styles.title} numberOfLines={2}>{stream.title}</Text>
            <Text style={styles.meta}>{stream.streamer} · {formatViewCount(stream.viewerCount)} watching</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function LiveRow({ streams }: { streams: LiveStream[] }) {
  return (
    <View style={styles.row}>
      {streams.map((s) => (
        <LiveStreamCard key={s.id} stream={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingHorizontal: 16 },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.8),
  },
  featured: { marginHorizontal: 16, marginBottom: 16 },
  thumb: { width: '100%', height: 180, backgroundColor: colors.secondary },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.scrimLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  liveText: { color: colors.onVideo, fontSize: 10, fontWeight: '800' },
  vipBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  vipText: { color: '#000', fontSize: 10, fontWeight: '800' },
  body: { padding: 12 },
  bodyRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary },
  bodyText: { flex: 1 },
  title: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
});
