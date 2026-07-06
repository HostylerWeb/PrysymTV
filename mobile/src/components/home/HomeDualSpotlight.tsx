import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { VideoCard, PodcastEpisode } from '@/types/api';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  shorts: VideoCard[];
  podcasts: PodcastEpisode[];
};

export function HomeDualSpotlight({ shorts, podcasts }: Props) {
  const router = useRouter();
  const short = shorts[0];
  const podcast = podcasts[0];

  if (!short && !podcast) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Quick hits</Text>
      <View style={styles.row}>
        {short ? (
          <Pressable style={styles.card} onPress={() => router.push('/(tabs)/shorts')}>
            <Image source={{ uri: short.thumbnailUrl ?? '' }} style={styles.shortImg} contentFit="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.label}>Shorts</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{short.title}</Text>
            </View>
          </Pressable>
        ) : null}
        {podcast ? (
          <Pressable style={styles.card} onPress={() => router.push(`/podcast/${podcast.id}`)}>
            <Image source={{ uri: podcast.coverUrl ?? '' }} style={styles.podImg} contentFit="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.label}>Podcasts</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{podcast.title}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, paddingHorizontal: spacing.page },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortImg: { width: '100%', height: 120 },
  podImg: { width: '100%', height: 100 },
  cardBody: { padding: 10 },
  label: { color: colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  cardTitle: { color: colors.foreground, fontSize: 13, fontWeight: '700' },
});
