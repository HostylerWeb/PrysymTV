import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  buildLiveCameraPublisherSource,
  type PublisherMessage,
} from '@/components/live/live-camera-publisher-html';
import type { LiveCameraPublisherProps } from '@/components/live/live-camera-publisher-types';

export function LiveCameraPublisher({
  whipPublishUrl,
  publishing,
  onReady,
  onConnected,
  onError,
}: LiveCameraPublisherProps) {
  const webRef = useRef<WebView>(null);
  const source = useMemo(
    () => buildLiveCameraPublisherSource(whipPublishUrl, publishing),
    [whipPublishUrl, publishing],
  );

  useEffect(() => {
    webRef.current?.postMessage(JSON.stringify({ type: 'setPublishing', value: publishing }));
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
        source={source}
        style={styles.web}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mediaCapturePermissionGrantType="grant"
        onMessage={onMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
