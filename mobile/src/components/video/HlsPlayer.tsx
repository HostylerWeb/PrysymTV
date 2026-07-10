import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VideoQualityMenu } from '@/components/video/VideoQualityMenu';
import { fetchHlsVariants, type HlsVariant } from '@/lib/hls-variants';
import { colors, withAlpha } from '@/theme/tokens';

type Props = {
  source: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  nativeControls?: boolean;
  tapToToggle?: boolean;
  /** TikTok-style tap reveals timeline scrubber. */
  seekOnTap?: boolean;
  enableQualityMenu?: boolean;
  posterUrl?: string | null;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  contentFit?: 'contain' | 'cover' | 'fill';
  aspectRatio?: number;
  fill?: boolean;
  paused?: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HlsPlayer({
  source,
  autoPlay = true,
  loop = false,
  muted = false,
  nativeControls = false,
  tapToToggle = true,
  seekOnTap = false,
  enableQualityMenu = false,
  posterUrl,
  onProgress,
  onEnded,
  contentFit = 'contain',
  aspectRatio = 16 / 9,
  fill = false,
  paused = false,
}: Props) {
  const masterSource = useMemo(() => source, [source]);
  const [activeSource, setActiveSource] = useState(source);
  const [variants, setVariants] = useState<HlsVariant[]>([]);
  const [selectedVariantUri, setSelectedVariantUri] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay && !paused);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [chromeVisible, setChromeVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const wasPlayingRef = useRef(false);

  const player = useVideoPlayer(
    { uri: activeSource, contentType: activeSource.includes('.m3u8') ? 'hls' : 'auto' },
    (p) => {
      p.loop = loop;
      p.muted = muted;
      p.timeUpdateEventInterval = 0.25;
    },
  );

  useEffect(() => {
    setActiveSource(source);
    setSelectedVariantUri(null);
  }, [source]);

  useEffect(() => {
    if (!enableQualityMenu) return;
    let cancelled = false;
    void fetchHlsVariants(masterSource).then((list) => {
      if (!cancelled) setVariants(list);
    });
    return () => {
      cancelled = true;
    };
  }, [enableQualityMenu, masterSource]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  useEffect(() => {
    if (paused || !appActive) {
      player.pause();
      setPlaying(false);
      return;
    }
    if (seekOnTap && chromeVisible) {
      player.pause();
      setPlaying(false);
      return;
    }
    if (autoPlay) {
      player.play();
    }
  }, [player, paused, appActive, chromeVisible, seekOnTap, autoPlay]);

  useEffect(() => {
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
      if (isPlaying) {
        setReady(true);
        setBuffering(false);
      }
    });
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setReady(true);
        setBuffering(false);
      } else if (status === 'loading') {
        setBuffering(true);
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player]);

  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime: t }) => {
      const d = player.duration;
      setCurrentTime(t);
      setDuration(d);
      onProgress?.(t, d);
    });
    return () => sub.remove();
  }, [player, onProgress]);

  useEffect(() => {
    if (!onEnded) return;
    const sub = player.addListener('playToEnd', () => onEnded());
    return () => sub.remove();
  }, [player, onEnded]);

  const togglePlay = () => {
    if (!tapToToggle || nativeControls) return;
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };

  const handleVideoTap = () => {
    if (nativeControls) return;
    if (seekOnTap) {
      if (!chromeVisible) {
        wasPlayingRef.current = player.playing;
        if (player.playing) {
          player.pause();
          setPlaying(false);
        }
        setChromeVisible(true);
        return;
      }
      setChromeVisible(false);
      if (wasPlayingRef.current) {
        player.play();
        setPlaying(true);
      }
      return;
    }
    togglePlay();
  };

  const seekToRatio = (ratio: number) => {
    const next = Math.max(0, Math.min(1, ratio)) * (duration || 0);
    player.currentTime = next;
    setCurrentTime(next);
  };

  const onTrackPress = (event: { nativeEvent: { locationX: number } }) => {
    if (!trackWidth || !duration) return;
    seekToRatio(event.nativeEvent.locationX / trackWidth);
  };

  const onQualitySelect = (variant: HlsVariant | null) => {
    if (!variant) {
      setSelectedVariantUri(null);
      setActiveSource(masterSource);
      player.replace({ uri: masterSource, contentType: 'hls' });
      return;
    }
    setSelectedVariantUri(variant.uri);
    setActiveSource(variant.uri);
    const resumeAt = player.currentTime;
    player.replace({ uri: variant.uri, contentType: 'hls' });
    if (resumeAt > 0) player.currentTime = resumeAt;
  };

  const showLoading = (!ready || buffering) && !playing && !nativeControls;
  const showPausedOverlay = !nativeControls && ready && !playing && !buffering && !chromeVisible;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.wrap, fill ? StyleSheet.absoluteFillObject : { aspectRatio }]}>
      {posterUrl && (!ready || !playing) ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} contentFit={contentFit} />
      ) : null}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={contentFit}
        allowsFullscreen
        allowsPictureInPicture={false}
        nativeControls={nativeControls}
        pointerEvents={nativeControls ? 'box-none' : 'none'}
      />
      {showLoading ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={withAlpha(colors.onVideo, 0.9)} />
        </View>
      ) : null}
      {showPausedOverlay ? (
        <View style={styles.overlay} pointerEvents="none">
          <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
        </View>
      ) : null}
      {!nativeControls && (tapToToggle || seekOnTap) ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleVideoTap}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        />
      ) : null}
      {!nativeControls && chromeVisible && seekOnTap ? (
        <View style={styles.chrome} pointerEvents="box-none">
          <View style={styles.chromeRow}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              hitSlop={8}
            >
              <Ionicons
                name={playing ? 'pause' : 'play'}
                size={22}
                color={colors.onVideo}
              />
            </Pressable>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            {enableQualityMenu ? (
              <VideoQualityMenu
                variants={variants}
                selectedUri={selectedVariantUri}
                onSelect={onQualitySelect}
              />
            ) : null}
          </View>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
            onPressIn={onTrackPress}
            style={styles.track}
          >
            <View style={[styles.trackFill, { width: `${progress}%` }]} />
          </Pressable>
        </View>
      ) : null}
      {!nativeControls && enableQualityMenu && !seekOnTap ? (
        <View style={styles.qualityCorner} pointerEvents="box-none">
          <VideoQualityMenu
            variants={variants}
            selectedUri={selectedVariantUri}
            onSelect={onQualitySelect}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.15),
  },
  chrome: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 8,
  },
  chromeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: colors.onVideo,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  qualityCorner: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});
