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
import { useTvAdGate } from '@/hooks/useTvAdGate';
import { colors, spacing, typography } from '@/theme/tokens';
import { withContentServiceGate } from '@/components/tv/ContentServiceGate';

function PodcastEpisodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = usePodcastEpisodeDetail(id);
  const [playRequested, setPlayRequested] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);

  const isVideo = data?.mediaType === 'video' && data.playbackSource;
  const adGate = useTvAdGate(
    'movie_preroll',
    data?.id,
    Boolean(playRequested && data?.id && (isVideo || data?.playbackSource)),
  );

  usePlaybackProgress(
    'podcast_episode',
    data?.id,
    progressSeconds,
    data?.durationSeconds ?? 0,
    adGate.canPlay && playRequested,
  );

  const begin = () => {
    if (!playRequested) setPlayRequested(true);
  };

  const showBrowse = !playRequested || adGate.checking;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Text style={styles.error}>Could not load episode.</Text>
        </View>
      ) : adGate.canPlay && playRequested && isVideo ? (
        <View style={styles.playerSlot}>
          <TvAdOverlay
            inline
            visible={adGate.showOverlay}
            placement="movie_preroll"
            videoId={data?.id}
            creatorId={data?.creator?.id}
            servedAd={adGate.servedAd}
            onComplete={adGate.completeAd}
          />
          <PlayerShell title={data.title} playbackUrl={data.playbackSource} />
        </View>
      ) : adGate.canPlay && playRequested && !isVideo && data.playbackSource ? (
        <View style={styles.audioWrap}>
          <AudioPlayer
            source={data.playbackSource}
            title={data.title}
            durationSeconds={data.durationSeconds}
            autoPlay
            onProgress={setProgressSeconds}
          />
        </View>
      ) : showBrowse ? (
        <ScrollView contentContainerStyle={styles.content}>
          {data.coverUrl ? (
            <Image source={{ uri: data.coverUrl }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.show}>{data.show?.title}</Text>
          {adGate.checking ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.checking} />
          ) : (
            <Pressable focusable hasTVPreferredFocus onPress={begin} style={styles.playBtn}>
              <Text style={styles.playPrompt}>▶ Play episode</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  playerSlot: { flex: 1, position: 'relative' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  audioWrap: { flex: 1, justifyContent: 'center', padding: spacing.xl },
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
  checking: { marginTop: spacing.lg },
  error: { color: '#ff6b6b', fontSize: typography.body },
});

export default withContentServiceGate('podcasts', PodcastEpisodeScreen);
