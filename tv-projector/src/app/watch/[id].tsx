import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvWatchPlayerLayout } from '@/components/video/TvWatchPlayerLayout';
import { useVideoDetail, resolveVideoPlayback } from '@/hooks/api/useVideoDetail';
import { withContentServiceGate } from '@/components/tv/ContentServiceGate';
import { colors } from '@/theme/tokens';

function WatchScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    thumbnailUrl?: string;
  }>();

  const videoQuery = useVideoDetail(params.id);
  const detail = videoQuery.data;
  const playbackUrl = useMemo(() => resolveVideoPlayback(detail), [detail]);
  const title = detail?.title ?? params.title ?? 'Watch';
  const posterUrl = detail?.thumbnailUrl ?? params.thumbnailUrl ?? null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <TvWatchPlayerLayout
        contentId={params.id}
        playbackUrl={playbackUrl}
        title={title}
        posterUrl={posterUrl}
        adPlacement="movie_preroll"
        creatorId={detail?.creator?.id}
        durationSeconds={detail?.durationSeconds ?? 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.videoBackground,
  },
});

export default withContentServiceGate('videos', WatchScreen);
