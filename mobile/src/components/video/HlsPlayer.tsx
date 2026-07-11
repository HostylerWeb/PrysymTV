import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { VideoQualityMenu } from '@/components/video/VideoQualityMenu';
import { fetchHlsVariants, type HlsVariant } from '@/lib/hls-variants';
import { colors, radius, withAlpha } from '@/theme/tokens';

function safePause(player: VideoPlayer) {
  try {
    player.pause();
  } catch {
    // Native player may already be released during tab/navigation unmount.
  }
}

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
  enableFullscreen?: boolean;
  /** `inline` keeps the player in a scrollable parent (e.g. vertical episode pager). */
  fullscreenPresentation?: 'modal' | 'inline';
  /** Parent-controlled fullscreen (inline presentation). */
  externalFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  posterUrl?: string | null;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  contentFit?: 'contain' | 'cover' | 'fill';
  aspectRatio?: number;
  fill?: boolean;
  paused?: boolean;
  /** Extra space above the bottom edge for corner controls (e.g. vertical episode meta). */
  controlsBottomInset?: number;
  /** Place corner controls at the top to avoid system nav bars on full-screen players. */
  controlsPlacement?: 'bottom' | 'top';
  controlsTopInset?: number;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayerOverlayControls({
  enableQualityMenu,
  enableFullscreen,
  isFullscreen,
  onToggleFullscreen,
  variants,
  selectedVariantUri,
  onQualitySelect,
  inline,
}: {
  enableQualityMenu: boolean;
  enableFullscreen: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  variants: HlsVariant[];
  selectedVariantUri: string | null;
  onQualitySelect: (variant: HlsVariant | null) => void;
  inline?: boolean;
}) {
  if (!enableQualityMenu && !enableFullscreen) return null;

  return (
    <View style={[styles.controlsRow, inline && styles.controlsRowInline]} pointerEvents="box-none">
      {enableQualityMenu ? (
        <VideoQualityMenu
          variants={variants}
          selectedUri={selectedVariantUri}
          onSelect={onQualitySelect}
        />
      ) : null}
      {enableFullscreen ? (
        <Pressable
          style={styles.fullscreenBtn}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={18}
            color={colors.onVideo}
          />
        </Pressable>
      ) : null}
    </View>
  );
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
  enableFullscreen = false,
  fullscreenPresentation = 'modal',
  externalFullscreen,
  onFullscreenChange,
  posterUrl,
  onProgress,
  onEnded,
  contentFit = 'contain',
  aspectRatio = 16 / 9,
  fill = false,
  paused = false,
  controlsBottomInset,
  controlsPlacement = 'bottom',
  controlsTopInset,
}: Props) {
  const insets = useSafeAreaInsets();
  const masterSource = useMemo(() => source, [source]);
  const [activeSource, setActiveSource] = useState(source);
  const [variants, setVariants] = useState<HlsVariant[]>([]);
  const [selectedVariantUri, setSelectedVariantUri] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay && !paused);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [chromeVisible, setChromeVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const wasPlayingRef = useRef(false);
  const fullscreenOn = externalFullscreen ?? isFullscreen;

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
    if (paused && fullscreenOn && fullscreenPresentation === 'modal') {
      if (externalFullscreen === undefined) {
        setIsFullscreen(false);
      } else {
        onFullscreenChange?.(false);
      }
    }
  }, [paused, fullscreenOn, fullscreenPresentation, externalFullscreen, onFullscreenChange]);

  useEffect(() => {
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  useEffect(() => {
    if (paused || !appActive) {
      safePause(player);
      setPlaying(false);
      return;
    }
    if (seekOnTap && chromeVisible) {
      safePause(player);
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

  const onQualitySelect = async (variant: HlsVariant | null) => {
    const resumeAt = player.currentTime;
    try {
      if (!variant) {
        setSelectedVariantUri(null);
        setActiveSource(masterSource);
        await player.replaceAsync({ uri: masterSource, contentType: 'hls' });
      } else {
        setSelectedVariantUri(variant.uri);
        setActiveSource(variant.uri);
        await player.replaceAsync({ uri: variant.uri, contentType: 'hls' });
      }
      if (resumeAt > 0) player.currentTime = resumeAt;
    } catch {
      /* quality switch failed — player keeps previous source */
    }
  };

  const toggleFullscreen = () => {
    setChromeVisible(false);
    const next = !fullscreenOn;
    if (externalFullscreen !== undefined) {
      onFullscreenChange?.(next);
      return;
    }
    setIsFullscreen(next);
    onFullscreenChange?.(next);
  };

  const useModalFullscreen = fullscreenPresentation === 'modal';
  const showModal = useModalFullscreen && fullscreenOn;

  useEffect(() => {
    if (!fullscreenOn) return;
    let cancelled = false;
    void ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      if (cancelled) return;
      cancelled = true;
      if (useModalFullscreen) {
        void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
  }, [fullscreenOn, useModalFullscreen]);

  const cornerBottom = controlsBottomInset ?? insets.bottom + 12;
  const cornerTop = controlsTopInset ?? insets.top + 12;

  const showLoading = (!ready || buffering) && !playing && !nativeControls;
  const showPausedOverlay = !nativeControls && ready && !playing && !buffering && !chromeVisible;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showCornerControls =
    !nativeControls &&
    (enableQualityMenu || enableFullscreen) &&
    !seekOnTap &&
    (!fullscreenOn || (fullscreenPresentation === 'inline' && !playing));

  const renderPlayerSurface = (fullscreen: boolean) => (
    <View
      style={[
        styles.wrap,
        fullscreen
          ? styles.fullscreenWrap
          : fill
            ? StyleSheet.absoluteFillObject
            : { aspectRatio },
      ]}
    >
      {posterUrl && (!ready || !playing) ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} contentFit={contentFit} />
      ) : null}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={contentFit}
        fullscreenOptions={{ enable: false }}
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
        <View style={[styles.chrome, fullscreen && { bottom: 12 + insets.bottom }]} pointerEvents="box-none">
          <View style={styles.chromeRow}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              hitSlop={8}
            >
              <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.onVideo} />
            </Pressable>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            <PlayerOverlayControls
              enableQualityMenu={enableQualityMenu}
              enableFullscreen={enableFullscreen}
              isFullscreen={fullscreen}
              onToggleFullscreen={toggleFullscreen}
              variants={variants}
              selectedVariantUri={selectedVariantUri}
              onQualitySelect={onQualitySelect}
              inline
            />
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
      {showCornerControls ? (
        <View
          style={[
            controlsPlacement === 'top' ? styles.qualityCornerTop : styles.qualityCorner,
            controlsPlacement === 'top'
              ? { top: cornerTop }
              : { bottom: cornerBottom },
          ]}
          pointerEvents="box-none"
        >
          <PlayerOverlayControls
            enableQualityMenu={enableQualityMenu}
            enableFullscreen={enableFullscreen}
            isFullscreen={fullscreenOn}
            onToggleFullscreen={toggleFullscreen}
            variants={variants}
            selectedVariantUri={selectedVariantUri}
            onQualitySelect={onQualitySelect}
          />
        </View>
      ) : null}
      {fullscreen ? (
        <Pressable
          style={[styles.fullscreenClose, { top: insets.top + 8 }]}
          onPress={toggleFullscreen}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={colors.onVideo} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <>
      {!showModal ? renderPlayerSurface(fullscreenOn && !useModalFullscreen) : null}
      <Modal
        visible={showModal}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={toggleFullscreen}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenModal}>{renderPlayerSurface(true)}</View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fullscreenWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  qualityCornerTop: {
    position: 'absolute',
    right: 12,
    zIndex: 5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlsRowInline: {
    marginLeft: 'auto',
  },
  fullscreenBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.secondary, 0.8),
  },
  fullscreenClose: {
    position: 'absolute',
    right: 12,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.45),
  },
});
