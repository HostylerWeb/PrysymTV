import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { AudioPlayer } from '@/components/podcasts/AudioPlayer';
import { PlayerShell } from '@/components/video/PlayerShell';
import { usePodcastEpisodeDetail } from '@/hooks/api/usePodcastEpisodeDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PodcastEpisodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = usePodcastEpisodeDetail(id);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);

  usePlaybackProgress(
    'podcast_episode',
    data?.id,
    progressSeconds,
    data?.durationSeconds ?? 0,
    started,
  );

  const begin = () => {
    if (!started) setPrerollOpen(true);
  };

  const isVideo = data?.mediaType === 'video' && data.playbackSource;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <TvAdOverlay
        visible={prerollOpen}
        placement="movie_preroll"
        videoId={data?.id}
        creatorId={data?.creator?.id}
        onComplete={() => {
          setPrerollOpen(false);
          setStarted(true);
        }}
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Text style={styles.error}>Could not load episode.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {data.coverUrl ? (
            <Image source={{ uri: data.coverUrl }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.show}>{data.show?.title}</Text>
          {!started ? (
            <Pressable focusable hasTVPreferredFocus onPress={begin} style={styles.playBtn}>
              <Text style={styles.playPrompt}>▶ Play episode</Text>
            </Pressable>
          ) : null}
          {started && isVideo ? (
            <PlayerShell title={data.title} playbackUrl={data.playbackSource} />
          ) : null}
          {started && !isVideo && data.playbackSource ? (
            <AudioPlayer
              source={data.playbackSource}
              title={data.title}
              durationSeconds={data.durationSeconds}
              autoPlay
              onProgress={setProgressSeconds}
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.xl, alignItems: 'center' },
  cover: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.secondary,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  show: { color: colors.mutedForeground, fontSize: typography.body, marginBottom: spacing.lg },
  playBtn: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playPrompt: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  error: { color: '#ff6b6b', fontSize: typography.body },
});
