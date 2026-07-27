import React, { useEffect } from 'react';
import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';

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
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') onReady();
      if (status === 'error') onError();
      if (error) onError();
    });
    const endSub = player.addListener('playToEnd', () => {
      onEnded?.();
    });
    return () => {
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
