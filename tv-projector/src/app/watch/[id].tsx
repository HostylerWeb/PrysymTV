import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { PlayerShell } from '@/components/video/PlayerShell';
import { fetchVideo } from '@/lib/api/videos';
import { resolvePlaybackUrl } from '@/lib/media-url';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { colors } from '@/theme/tokens';

export default function WatchScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    playbackUrl?: string;
  }>();

  const [title, setTitle] = useState(params.title ?? 'Watch');
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(
    params.playbackUrl?.trim() || null,
  );
  const [creatorId, setCreatorId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchVideo(params.id);
        if (cancelled) return;
        setTitle(detail.title);
        setCreatorId(detail.creator?.id);
        setDurationSeconds(detail.durationSeconds ?? 0);
        if (!playbackUrl) {
          setPlaybackUrl(resolvePlaybackUrl(detail));
        }
      } catch {
        if (!cancelled && !playbackUrl) setPlaybackUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!playbackUrl || loading) return;
    setStarted(false);
    setPrerollOpen(true);
  }, [params.id, playbackUrl, loading]);

  usePlaybackProgress(
    'video',
    params.id,
    progressSeconds,
    durationSeconds,
    started && durationSeconds > 0,
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <TvAdOverlay
        visible={prerollOpen}
        placement="movie_preroll"
        videoId={params.id}
        creatorId={creatorId}
        onComplete={() => {
          setPrerollOpen(false);
          setStarted(true);
        }}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : started && playbackUrl ? (
        <PlayerShell
          title={title}
          playbackUrl={playbackUrl}
          onProgress={(seconds, duration) => {
            setProgressSeconds(seconds);
            if (duration > 0) setDurationSeconds(duration);
          }}
        />
      ) : !playbackUrl ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
