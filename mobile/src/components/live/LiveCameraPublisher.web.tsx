import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWsUrl } from '@/lib/api/config';
import { uploadStreamThumbnailOnce } from '@/lib/stream-thumbnail';
import type { LiveCameraPublisherProps } from '@/components/live/live-camera-publisher-types';

type Publisher = { close: () => void };

type PublisherCtor = new (conf: {
  url: string;
  stream: MediaStream;
  videoCodec?: string;
  audioCodec?: string;
  onError?: (err: string) => void;
  onConnected?: () => void;
}) => Publisher;

type DeviceOption = { deviceId: string; label: string };

declare global {
  interface Window {
    MediaMTXWebRTCPublisher?: PublisherCtor;
  }
}

async function detectPublisherCodecs(): Promise<{ videoCodec: string; audioCodec: string }> {
  const pc = new RTCPeerConnection({});
  pc.addTransceiver('video', { direction: 'sendonly' });
  pc.addTransceiver('audio', { direction: 'sendonly' });
  const desc = await pc.createOffer();
  const sdp = desc.sdp?.toLowerCase() ?? '';
  pc.close();
  const videoCodec =
    ['h264/90000', 'vp8/90000', 'vp9/90000'].find((c) => sdp.includes(c)) ?? 'vp8/90000';
  const audioCodec =
    ['opus/48000', 'pcmu/8000', 'pcma/8000'].find((c) => sdp.includes(c)) ?? 'opus/48000';
  return { videoCodec, audioCodec };
}

function mapDevices(devices: MediaDeviceInfo[], kind: 'videoinput' | 'audioinput'): DeviceOption[] {
  return devices
    .filter((d) => d.kind === kind && d.deviceId)
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label?.trim() || `${kind === 'videoinput' ? 'Camera' : 'Microphone'} ${i + 1}`,
    }));
}

async function captureVideoDataUrl(video: HTMLVideoElement): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not capture frame');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function loadPublisherScript(origin: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MediaMTXWebRTCPublisher) return Promise.resolve();
  const src = `${origin.replace(/\/$/, '')}/mediamtx-publisher.js`;
  const existing = document.querySelector(`script[data-mediamtx-publisher="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Publisher script failed')), {
        once: true,
      });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.mediamtxPublisher = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load broadcast publisher'));
    document.head.appendChild(script);
  });
}

/** Browser camera publisher for Expo web (react-native-webview is native-only). */
export function LiveCameraPublisher({
  whipPublishUrl,
  streamId,
  publishing,
  onReady,
  onConnected,
  onError,
  onDevices,
}: LiveCameraPublisherProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const publisherRef = useRef<Publisher | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const skipDeviceSwitch = useRef(true);
  const thumbnailSent = useRef(false);

  const [previewReady, setPreviewReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceOption[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [showDevices, setShowDevices] = useState(false);

  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && mediaRef.current) {
      node.srcObject = mediaRef.current;
      void node.play().catch(() => {});
    }
  }, []);

  const refreshDeviceLists = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const video = mapDevices(devices, 'videoinput');
    const audio = mapDevices(devices, 'audioinput');
    setVideoDevices(video);
    setAudioDevices(audio);
    onDevices?.({ videoDevices: video, audioDevices: audio });
  }, [onDevices]);

  const acquireMedia = useCallback(async (videoDeviceId?: string, audioDeviceId?: string) => {
    const videoConstraint = videoDeviceId
      ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: 'user' as const, width: { ideal: 1280 }, height: { ideal: 720 } };
    return navigator.mediaDevices.getUserMedia({
      video: videoConstraint,
      audio: {
        ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  }, []);

  const attachMedia = useCallback(
    (media: MediaStream) => {
      mediaRef.current = media;
      const el = videoRef.current;
      if (el) {
        el.srcObject = media;
        void el.play().catch(() => {});
      }
      const videoTrack = media.getVideoTracks()[0];
      const audioTrack = media.getAudioTracks()[0];
      if (videoTrack) {
        setCameraOn(videoTrack.enabled);
        const id = videoTrack.getSettings().deviceId;
        if (id) setSelectedVideoId(id);
      }
      if (audioTrack) {
        setMicOn(audioTrack.enabled);
        const id = audioTrack.getSettings().deviceId;
        if (id) setSelectedAudioId(id);
      }
      setPreviewReady(true);
      onReady?.();
    },
    [onReady],
  );

  useEffect(() => {
    let cancelled = false;
    const origin = getWsUrl();

    void loadPublisherScript(origin)
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Publisher unavailable';
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      });

    async function startPreview() {
      try {
        const media = await acquireMedia();
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        attachMedia(media);
        await refreshDeviceLists();
        skipDeviceSwitch.current = false;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Camera access denied';
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      }
    }

    void startPreview();

    const onDeviceChange = () => {
      void refreshDeviceLists();
    };
    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange);

    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange);
      publisherRef.current?.close();
      publisherRef.current = null;
      mediaRef.current?.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    };
  }, [acquireMedia, attachMedia, onError, refreshDeviceLists]);

  useEffect(() => {
    if (skipDeviceSwitch.current || publishing) return;

    let cancelled = false;

    async function switchDevices() {
      try {
        mediaRef.current?.getTracks().forEach((t) => t.stop());
        const media = await acquireMedia(
          selectedVideoId || undefined,
          selectedAudioId || undefined,
        );
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        attachMedia(media);
        await refreshDeviceLists();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not switch camera or microphone';
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      }
    }

    void switchDevices();

    return () => {
      cancelled = true;
    };
  }, [
    selectedVideoId,
    selectedAudioId,
    publishing,
    acquireMedia,
    attachMedia,
    onError,
    refreshDeviceLists,
  ]);

  useEffect(() => {
    if (!publishing || !scriptReady || !previewReady || !mediaRef.current || !whipPublishUrl) {
      if (!publishing) {
        publisherRef.current?.close();
        publisherRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const media = mediaRef.current;

    async function startPublish() {
      try {
        const { videoCodec, audioCodec } = await detectPublisherCodecs();
        if (cancelled || !media || !window.MediaMTXWebRTCPublisher) return;
        publisherRef.current?.close();
        publisherRef.current = new window.MediaMTXWebRTCPublisher({
          url: whipPublishUrl,
          stream: media,
          videoCodec,
          audioCodec,
          onConnected: () => {
            if (!cancelled) {
              onConnected?.();
              const video = videoRef.current;
              if (streamId && video && !thumbnailSent.current) {
                thumbnailSent.current = true;
                void captureVideoDataUrl(video)
                  .then((dataUrl) => uploadStreamThumbnailOnce(streamId, dataUrl))
                  .catch(() => {});
              }
            }
          },
          onError: (msg) => {
            if (!cancelled) {
              setError(msg);
              onError?.(msg);
            }
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not start broadcast';
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      }
    }

    void startPublish();

    return () => {
      cancelled = true;
      publisherRef.current?.close();
      publisherRef.current = null;
    };
  }, [publishing, scriptReady, previewReady, whipPublishUrl, onConnected, onError, streamId]);

  const toggleVideo = () => {
    const track = mediaRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  };

  const toggleAudio = () => {
    const track = mediaRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  return (
    <View style={styles.wrap}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <video
        ref={attachVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000',
          transform: 'scaleX(-1)',
        }}
      />
      {!previewReady && !error ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={toggleVideo}>
          <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={toggleAudio}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={20} color="#fff" />
        </Pressable>
        {!publishing && previewReady ? (
          <Pressable style={styles.controlBtn} onPress={() => setShowDevices((v) => !v)}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>
      {!publishing && previewReady && showDevices ? (
        <View style={styles.devicePanel}>
          <Text style={styles.deviceLabel}>Camera</Text>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <select
            value={selectedVideoId}
            onChange={(e) => setSelectedVideoId(e.target.value)}
            style={webSelectStyle}
          >
            {videoDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          <Text style={styles.deviceLabel}>Microphone</Text>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <select
            value={selectedAudioId}
            onChange={(e) => setSelectedAudioId(e.target.value)}
            style={webSelectStyle}
          >
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000', position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 56,
    backgroundColor: 'rgba(220,38,38,0.9)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: '#fff', fontSize: 12 },
  controls: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devicePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    backgroundColor: 'rgba(24,24,27,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  deviceLabel: { color: '#d4d4d8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
});

const webSelectStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 8,
  backgroundColor: '#27272a',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 8,
  padding: '0 10px',
};
