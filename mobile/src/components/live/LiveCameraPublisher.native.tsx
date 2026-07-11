import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  LiveCameraPublisherProps,
  PublisherMessage,
} from '@/components/live/live-camera-publisher-types';
import { buildLiveCameraPublisherUri } from '@/components/live/live-camera-publisher-uri';
import { uploadStreamThumbnailOnce } from '@/lib/stream-thumbnail';

export function LiveCameraPublisher({
  whipPublishUrl,
  streamId,
  publishing,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  cameraEnabled,
  micEnabled,
  onReady,
  onConnected,
  onError,
  onDevices,
}: LiveCameraPublisherProps) {
  const webRef = useRef<WebView>(null);
  const uri = useMemo(() => buildLiveCameraPublisherUri(whipPublishUrl), [whipPublishUrl]);

  const postControl = useCallback((msg: object) => {
    webRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    postControl({ type: 'setPublishing', value: publishing });
  }, [publishing, postControl]);

  useEffect(() => {
    if (!selectedVideoDeviceId && !selectedAudioDeviceId) return;
    postControl({
      type: 'setDevices',
      videoDeviceId: selectedVideoDeviceId ?? '',
      audioDeviceId: selectedAudioDeviceId ?? '',
    });
  }, [selectedVideoDeviceId, selectedAudioDeviceId, postControl]);

  useEffect(() => {
    if (cameraEnabled === undefined) return;
    postControl({ type: 'setCameraEnabled', value: cameraEnabled });
  }, [cameraEnabled, postControl]);

  useEffect(() => {
    if (micEnabled === undefined) return;
    postControl({ type: 'setMicEnabled', value: micEnabled });
  }, [micEnabled, postControl]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as PublisherMessage;
      if (data.type === 'ready') onReady?.();
      if (data.type === 'connected') onConnected?.();
      if (data.type === 'error') onError?.(data.message);
      if (data.type === 'devices') {
        onDevices?.({
          videoDevices: data.videoDevices,
          audioDevices: data.audioDevices,
        });
      }
      if (data.type === 'thumbnail' && streamId) {
        void uploadStreamThumbnailOnce(streamId, data.dataUrl);
      }
    } catch {
      /* ignore */
    }
  };

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
        {...androidPermissionProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
