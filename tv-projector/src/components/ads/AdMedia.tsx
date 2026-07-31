import React, { useEffect } from 'react';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';

const AD_MEDIA_TIMEOUT_MS = 2500;

type Props = {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  style?: StyleProp<ImageStyle>;
  contentFit?: VideoContentFit;
  onReady: () => void;
  onError: () => void;
  onEnded?: () => void;
};

function AdVideoMedia({
  mediaUrl,
  style,
  contentFit = 'cover',
  onReady,
  onError,
  onEnded,
}: Omit<Props, 'mediaType'>) {
  const player = useVideoPlayer(mediaUrl, (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.play();
  });

  useEffect(() => {
    let finished = false;
    const fail = () => {
      if (finished) return;
      finished = true;
      onError();
    };

    const timeout = setTimeout(fail, AD_MEDIA_TIMEOUT_MS);

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        finished = true;
        clearTimeout(timeout);
        onReady();
      }
      if (status === 'error' || error) {
        clearTimeout(timeout);
        fail();
      }
    });
    const endSub = player.addListener('playToEnd', () => {
      onEnded?.();
    });
    return () => {
      clearTimeout(timeout);
      statusSub.remove();
      endSub.remove();
    };
  }, [player, onReady, onError, onEnded]);

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
