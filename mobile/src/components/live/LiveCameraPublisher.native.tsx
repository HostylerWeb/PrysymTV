import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { PublisherMessage } from '@/components/live/live-camera-publisher-html';
import { buildLiveCameraPublisherUri } from '@/components/live/live-camera-publisher-uri';
import type { LiveCameraPublisherProps } from '@/components/live/live-camera-publisher-types';

export function LiveCameraPublisher({
  whipPublishUrl,
  publishing,
  onReady,
  onConnected,
  onError,
}: LiveCameraPublisherProps) {
  const webRef = useRef<WebView>(null);
  const uri = useMemo(() => buildLiveCameraPublisherUri(whipPublishUrl), [whipPublishUrl]);

  useEffect(() => {
    const payload = JSON.stringify({ type: 'setPublishing', value: publishing });
    webRef.current?.postMessage(payload);
  }, [publishing]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as PublisherMessage;
      if (data.type === 'ready') onReady?.();
      if (data.type === 'connected') onConnected?.();
      if (data.type === 'error') onError?.(data.message);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*']}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mediaCapturePermissionGrantType="grant"
        onMessage={onMessage}
        onPermissionRequest={(request) => {
          if (Platform.OS === 'android') {
            request.nativeEvent.grant(request.nativeEvent.resources);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
