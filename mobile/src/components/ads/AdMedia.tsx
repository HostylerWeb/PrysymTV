import React, { useEffect } from 'react';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';

const AD_MEDIA_TIMEOUT_MS = 2500;
const MIN_PLAY_SECONDS = 0.15;

type Props = {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  style?: StyleProp<ImageStyle>;
  contentFit?: VideoContentFit;
  onReady: () => void;
  onError: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
};

function AdVideoMedia({
  mediaUrl,
  style,
  contentFit = 'cover',
  onReady,
  onError,
  onEnded,
  onTimeUpdate,
}: Omit<Props, 'mediaType'>) {
  const player = useVideoPlayer(mediaUrl, (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.timeUpdateEventInterval = 0.25;
    instance.play();
  });

  useEffect(() => {
    let finished = false;
    let readySignaled = false;

    const fail = () => {
      if (finished) return;
      finished = true;
      onError();
    };

    const signalReady = () => {
      if (finished || readySignaled) return;
      readySignaled = true;
      finished = true;
      clearTimeout(timeout);
      onReady();
    };

    const timeout = setTimeout(fail, AD_MEDIA_TIMEOUT_MS);

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) {
        clearTimeout(timeout);
        fail();
        return;
      }
      if (status === 'readyToPlay') {
        void player.play();
      }
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying && player.currentTime >= MIN_PLAY_SECONDS) {
        signalReady();
      }
    });

    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      if (player.playing && currentTime >= MIN_PLAY_SECONDS) {
        signalReady();
      }
      const duration = player.duration;
      if (Number.isFinite(duration) && duration > 0) {
        onTimeUpdate?.(currentTime, duration);
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      onEnded?.();
    });

    void player.play();

    return () => {
      finished = true;
      clearTimeout(timeout);
      statusSub.remove();
      playingSub.remove();
      timeSub.remove();
      endSub.remove();
    };
  }, [player, onReady, onError, onEnded, onTimeUpdate]);

  return (
    <VideoView
      player={player}
      style={[StyleSheet.absoluteFill, style]}
      contentFit={contentFit}
      nativeControls={false}
    />
  );
}

export function AdMedia({
  mediaUrl,
  mediaType,
  style,
  contentFit = 'cover',
  onReady,
  onError,
  onEnded,
  onTimeUpdate,
}: Props) {
  useEffect(() => {
    if (mediaType !== 'image') return;
    let finished = false;
    const fail = () => {
      if (finished) return;
      finished = true;
      onError();
    };
    const timeout = setTimeout(fail, AD_MEDIA_TIMEOUT_MS);
    return () => {
      finished = true;
      clearTimeout(timeout);
    };
  }, [mediaType, mediaUrl, onError]);

  if (mediaType === 'video') {
    return (
      <AdVideoMedia
        mediaUrl={mediaUrl}
        style={style}
        contentFit={contentFit}
        onReady={onReady}
        onError={onError}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
      />
    );
  }

  return (
    <Image
      source={{ uri: mediaUrl }}
      style={style}
      contentFit={contentFit}
      onLoad={onReady}
      onError={onError}
    />
  );
}
