import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { VideoCard, VerticalSeries } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type Props = {
  spotlight?: VideoCard;
  verticals: VerticalSeries[];
};

export function HomeEditorialGrid({ spotlight, verticals }: Props) {
  const router = useRouter();
  const featured = spotlight ?? null;
  const side = verticals.slice(0, 2);

  if (!featured && !side.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Editorial picks</Text>
      <Text style={styles.title}>Spotlight & series</Text>
      <View style={styles.grid}>
        {featured ? (
          <Pressable style={styles.spotlight} onPress={() => router.push(`/watch/${featured.id}`)}>
            <Image source={{ uri: featured.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.scrim} />
            <View style={styles.spotContent}>
              <Text style={styles.spotLabel}>Featured video</Text>
              <Text style={styles.spotTitle} numberOfLines={2}>{featured.title}</Text>
              <Button label="Watch" size="sm" onPress={() => router.push(`/watch/${featured.id}`)} />
            </View>
          </Pressable>
        ) : null}
        <View style={styles.sideCol}>
          {side.map((s) => (
            <Pressable key={s.slug} style={styles.verticalCard} onPress={() => router.push(`/verticals/${s.slug}`)}>
              <Image source={{ uri: s.posterUrl ?? '' }} style={styles.verticalPoster} contentFit="cover" />
              <View style={styles.verticalMeta}>
                <Text style={styles.verticalTitle} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.verticalSub}>{s.episodeCount} eps · {s.genre}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, paddingHorizontal: spacing.page },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 10 },
  spotlight: {
    flex: 1.2,
    minHeight: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(colors.background, 0.55) },
  spotContent: { flex: 1, justifyContent: 'flex-end', padding: 14 },
  spotLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  spotTitle: { color: colors.foreground, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  sideCol: { flex: 1, gap: 10 },
  verticalCard: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verticalPoster: { width: '100%', height: 72 },
  verticalMeta: { padding: 8 },
  verticalTitle: { color: colors.foreground, fontSize: 12, fontWeight: '700' },
  verticalSub: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
});
