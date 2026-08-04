import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { resolveAvatarUrl } from '@/lib/media-url';
import { colors } from '@/theme/tokens';

type Props = {
  title: string;
  hlsPlaybackUrl?: string | null;
  thumbnailUrl?: string | null;
  streamerAvatar?: string | null;
  streamerSlug?: string | null;
  streamer?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Muted live HLS preview when the stream is on air (YouTube-style). */
  enableLivePreview?: boolean;
};

/**
 * Live card thumbnail: static poster + muted HLS preview when available (matches web LiveStreamThumbnail).
 */
export function LiveStreamPreview({
  title,
  hlsPlaybackUrl,
  thumbnailUrl,
  streamerAvatar,
  streamerSlug,
  streamer,
  style,
  enableLivePreview = true,
}: Props) {
  const poster =
    thumbnailUrl?.trim() ||
    resolveAvatarUrl(streamerAvatar, streamerSlug ?? streamer ?? 'live');
  const hls = hlsPlaybackUrl?.trim() || null;
  const showLivePreview = enableLivePreview && Boolean(hls);

  return (
    <View style={[styles.wrap, style]} pointerEvents="box-none">
      {showLivePreview && hls ? (
        <View style={styles.previewLayer} pointerEvents="none">
          <HlsPlayer
            source={hls}
            posterUrl={poster}
            muted
            autoPlay
            isLive
            nativeControls={false}
            tapToToggle={false}
            enablePlayerChrome={false}
            fill
            contentFit="cover"
          />
        </View>
      ) : (
        <Image
          source={{ uri: poster }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    overflow: 'hidden',
  },
  previewLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    elevation: 1,
  },
});
