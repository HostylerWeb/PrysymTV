import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWsUrl } from '@/lib/api/config';
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
  publishing,
  onReady,
  onConnected,
  onError,
}: LiveCameraPublisherProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const publisherRef = useRef<Publisher | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && mediaRef.current) {
      node.srcObject = mediaRef.current;
      void node.play().catch(() => {});
    }
  }, []);

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
        const media = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaRef.current = media;
        const el = videoRef.current;
        if (el) {
          el.srcObject = media;
          await el.play().catch(() => {});
        }
        setPreviewReady(true);
        onReady?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Camera access denied';
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      }
    }

    void startPreview();

    return () => {
      cancelled = true;
      publisherRef.current?.close();
      publisherRef.current = null;
      mediaRef.current?.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    };
  }, [onError, onReady]);

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
            if (!cancelled) onConnected?.();
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
  }, [publishing, scriptReady, previewReady, whipPublishUrl, onConnected, onError]);

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
      </View>
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
});
