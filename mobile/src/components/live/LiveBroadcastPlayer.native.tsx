import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { getWsUrl } from '@/lib/api/config';
import { buildLiveViewerHtml, type LiveViewerMessage } from '@/components/live/live-viewer-html';
import type { LiveBroadcastPlayerProps } from '@/components/live/LiveBroadcastPlayer.types';
import { colors } from '@/theme/tokens';

export type { LiveBroadcastPlayerProps };

/**
 * Live watch: WebRTC/WHEP first (same as web), HLS fallback if WebRTC fails.
 */
export function LiveBroadcastPlayer({
  webrtcUrl,
  hlsUrl,
  posterUrl,
  contentFit = 'cover',
  paused = false,
  autoPlay = true,
  isLive = true,
  immersive = false,
}: LiveBroadcastPlayerProps) {
  const webRef = useRef<WebView>(null);
  const whep = webrtcUrl?.trim() ?? '';
  const hls = hlsUrl?.trim() ?? '';
  const [useHlsFallback, setUseHlsFallback] = useState(!whep);
  const [webrtcPlaying, setWebrtcPlaying] = useState(false);

  useEffect(() => {
    setUseHlsFallback(!whep);
    setWebrtcPlaying(false);
  }, [whep]);

  const viewerHtml = useMemo(() => (whep ? buildLiveViewerHtml(whep) : ''), [whep]);
  const baseUrl = useMemo(() => `${getWsUrl().replace(/\/$/, '')}/`, []);

  const postControl = useCallback((msg: object) => {
    webRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    if (useHlsFallback) return;
    postControl({ type: 'setPaused', value: paused });
  }, [paused, useHlsFallback, postControl]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as LiveViewerMessage;
        if (data.type === 'ready') {
          /* connected to WHEP */
        }
        if (data.type === 'playing') {
          setWebrtcPlaying(true);
        }
        if (data.type === 'error') {
          if (hls) setUseHlsFallback(true);
        }
      } catch {
        /* ignore */
      }
    },
    [hls],
  );

  const wrapStyle = [styles.wrap, immersive ? styles.wrapImmersive : styles.wrapInline];

  if (useHlsFallback) {
    if (!hls) {
      return (
        <View style={wrapStyle}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={immersive ? StyleSheet.absoluteFill : styles.poster} contentFit="cover" />
          ) : (
            <View style={immersive ? StyleSheet.absoluteFill : styles.poster} />
          )}
        </View>
      );
    }

    return (
      <View style={wrapStyle}>
        <HlsPlayer
          source={hls}
          posterUrl={posterUrl}
          contentFit={contentFit}
          autoPlay={autoPlay && !paused}
          paused={paused}
          isLive={isLive}
          nativeControls={false}
          tapToToggle={false}
          enablePlayerChrome={false}
          fill={immersive}
        />
      </View>
    );
  }

  const showWebrtcSpinner = !webrtcPlaying && !paused;

  const androidPermissionProps =
    Platform.OS === 'android'
      ? ({
          onPermissionRequest: (request: {
            nativeEvent: { grant: (resources: string[]) => void; resources: string[] };
          }) => {
            request.nativeEvent.grant(request.nativeEvent.resources);
          },
        } as Record<string, unknown>)
      : {};

  return (
    <View style={wrapStyle}>
      {posterUrl && !webrtcPlaying ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <WebView
        ref={webRef}
        source={{ html: viewerHtml, baseUrl }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*']}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        {...androidPermissionProps}
      />
      {showWebrtcSpinner ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.videoBackground,
    overflow: 'hidden',
  },
  wrapImmersive: {
    flex: 1,
    height: '100%',
  },
  wrapInline: {
    aspectRatio: 16 / 9,
  },
  web: {
    flex: 1,
    backgroundColor: '#000',
  },
  poster: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.secondary,
  },
  spinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
