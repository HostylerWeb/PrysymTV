import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BrandHero } from '@/components/home/BrandHero';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import type { VideoCard } from '@/types/api';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type Slide = VideoCard & { reason: 'new_release' | 'trending' };

const LABELS: Record<Slide['reason'], string> = {
  new_release: 'Recently added',
  trending: 'Popular on Prysym',
};

type Props = {
  slides: Slide[];
};

function MovieHeroCarousel({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const active = slides[index];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Image source={{ uri: active.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.scrimTop} />
        <View style={styles.scrimBottom} />
        <View style={styles.content}>
          <ThemedText variant="eyebrow" primary>
            {LABELS[active.reason]}
          </ThemedText>
          <ThemedText variant="hero" style={styles.movieTitle} numberOfLines={2}>
            {active.title}
          </ThemedText>
          <ThemedText variant="caption" muted style={styles.movieMeta}>
            {active.category ?? 'Movie'} · {active.releaseYear} · {active.channel}
          </ThemedText>
          <View style={styles.actions}>
            <Button label="Watch now" onPress={() => router.push(`/movie/${active.id}`)} style={styles.cta} />
          </View>
        </View>
        {slides.length > 1 && (
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <Pressable key={s.id} onPress={() => setIndex(i)}>
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export function HomeHero({ slides }: Props) {
  if (slides.length === 0) return <BrandHero />;
  return <MovieHeroCarousel slides={slides} />;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  card: {
    minHeight: 280,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
    backgroundColor: colors.muted,
  },
  scrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(colors.background, 0.15),
  },
  scrimBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(colors.background, 0.75),
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    minHeight: 280,
  },
  movieTitle: { lineHeight: 34, marginTop: spacing.xs, marginBottom: spacing.xs },
  movieMeta: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cta: { paddingHorizontal: spacing.lg },
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: withAlpha(colors.onVideo, 0.4),
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
});
