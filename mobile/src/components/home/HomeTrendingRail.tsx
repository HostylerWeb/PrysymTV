import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { VideoCard } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

type Props = { items: VideoCard[] };

export function HomeTrendingRail({ items }: Props) {
  const router = useRouter();
  const top = items.slice(0, 10);

  if (!top.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Top 10 today</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {top.map((item, i) => (
          <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/watch/${item.id}`)}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.thumb} contentFit="cover" />
            <View style={styles.meta}>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.channel} · {formatViewCount(item.viewsCount ?? 0)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800', paddingHorizontal: spacing.page, marginBottom: 12 },
  row: { paddingHorizontal: spacing.page, gap: 12 },
  card: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  rank: { color: colors.primary, fontSize: 22, fontWeight: '900', width: 28, textAlign: 'center' },
  thumb: { width: 72, height: 48, borderRadius: radius.md, backgroundColor: colors.secondary },
  meta: { flex: 1 },
  itemTitle: { color: colors.foreground, fontSize: 13, fontWeight: '700' },
  itemSub: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
});
