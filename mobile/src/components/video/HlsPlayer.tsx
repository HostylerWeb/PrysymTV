import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  LayoutChangeEvent,
  Modal,
  PanResponder,
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
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { VideoQualityMenu } from '@/components/video/VideoQualityMenu';
import { fetchHlsVariants, type HlsVariant } from '@/lib/hls-variants';
import { useImmersivePlaybackRegistration } from '@/context/ImmersivePlaybackContext';
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
  /** YouTube-style controls with seek bar; tap to show/hide while playing. */
  enablePlayerChrome?: boolean;
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
  onMutedChange?: (muted: boolean) => void;
  /** Live HLS (e.g. MediaMTX): keep at live edge; do not pause on segment end. */
  isLive?: boolean;
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
  enableMute,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  variants,
  selectedVariantUri,
  onQualitySelect,
  inline,
}: {
  enableQualityMenu: boolean;
  enableFullscreen: boolean;
  enableMute?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  variants: HlsVariant[];
  selectedVariantUri: string | null;
  onQualitySelect: (variant: HlsVariant | null) => void;
  inline?: boolean;
}) {
  if (!enableQualityMenu && !enableFullscreen && !enableMute) return null;

  return (
    <View style={[styles.controlsRow, inline && styles.controlsRowInline]} pointerEvents="box-none">
      {enableQualityMenu ? (
        <VideoQualityMenu
          variants={variants}
          selectedUri={selectedVariantUri}
          onSelect={onQualitySelect}
        />
      ) : null}
      {enableMute ? (
        <Pressable
          style={styles.fullscreenBtn}
          onPress={(e) => {
            e.stopPropagation();
            onToggleMute?.();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={colors.onVideo}
          />
        </Pressable>
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
  enablePlayerChrome = false,
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
  onMutedChange,
  isLive = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const masterSource = useMemo(() => source, [source]);
  const [activeSource, setActiveSource] = useState(source);
  const [variants, setVariants] = useState<HlsVariant[]>([]);
  const [selectedVariantUri, setSelectedVariantUri] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay && !paused);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [chromeVisible, setChromeVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVolumeMuted, setIsVolumeMuted] = useState(muted);
  const wasPlayingRef = useRef(false);
  const chromeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreenOn = externalFullscreen ?? isFullscreen;
  const trackWidthRef = useRef(0);
  const durationRef = useRef(0);
  const player = useVideoPlayer(
    { uri: activeSource, contentType: activeSource.includes('.m3u8') ? 'hls' : 'auto' },
    (p) => {
      p.loop = loop;
      p.muted = muted;
      p.timeUpdateEventInterval = 0.25;
      if (isLive) {
        // Stay close to live edge without over-buffering (web uses WebRTC; mobile uses HLS).
        p.bufferOptions = {
          preferredForwardBufferDuration: 3,
          minBufferForPlayback: 1,
          prioritizeTimeOverSizeThreshold: true,
        };
      }
    },
  );

  const seekToLiveEdge = useCallback(() => {
    try {
      if (!player.playing && !autoPlay) return;

      const total = player.duration;
      if (Number.isFinite(total) && total > 0) {
        const lag = total - player.currentTime;
        // Only jump when clearly behind — small seeks cause rebuffer spinners on Android.
        if (lag > 12) {
          player.currentTime = Math.max(0, total - 1);
        }
        return;
      }

      if (!Number.isFinite(total)) {
        const nativeOffset = player.currentOffsetFromLive;
        if (nativeOffset != null && Number.isFinite(nativeOffset) && nativeOffset > 12) {
          player.currentTime = player.currentTime + (nativeOffset - 1);
        }
      }
    } catch {
      // Native player may already be released during navigation.
    }
  }, [player, autoPlay]);

  useEffect(() => {
    setActiveSource(source);
    setSelectedVariantUri(null);
    setEnded(false);
  }, [source]);

  useEffect(() => {
    if (!enableQualityMenu) return;
    let cancelled = false;
    void fetchHlsVariants(masterSource).then((list) => {
      if (cancelled) return;
      if (list.length > 0) {
        setVariants(list);
        return;
      }
      if (masterSource.includes('.m3u8')) {
        setVariants([{ uri: masterSource, height: 0, label: 'Auto' }]);
      } else {
        setVariants([]);
      }
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

  useImmersivePlaybackRegistration(fullscreenOn);

  useEffect(() => {
    if (!playing || paused) return;
    activateKeepAwake('hls-player');
    return () => {
      void deactivateKeepAwake('hls-player');
    };
  }, [playing, paused]);

  useEffect(() => {
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  useEffect(() => {
    player.muted = muted;
    setIsVolumeMuted(muted);
  }, [player, muted]);

  const toggleVolumeMute = useCallback(() => {
    const next = !player.muted;
    player.muted = next;
    setIsVolumeMuted(next);
    onMutedChange?.(next);
  }, [player, onMutedChange]);

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
    if (!enablePlayerChrome || !ready) return;
    if (!playing) {
      setChromeVisible(true);
    }
  }, [enablePlayerChrome, playing, ready]);

  useEffect(() => {
    if (!enablePlayerChrome || !chromeVisible || !playing) return;
    if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
    chromeHideTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, 3000);
    return () => {
      if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
    };
  }, [enablePlayerChrome, chromeVisible, playing]);

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
        if (isLive) {
          seekToLiveEdge();
          if (!paused && appActive) player.play();
        }
      } else if (status === 'loading') {
        // During live playback, brief segment fetches should not flash the spinner.
        if (!isLive || !ready) setBuffering(true);
      } else if (status === 'error' && isLive) {
        setBuffering(false);
        try {
          player.play();
        } catch {
          /* ignore */
        }
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player, isLive, seekToLiveEdge, paused, appActive]);

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
    const sub = player.addListener('playToEnd', () => {
      if (isLive) {
        seekToLiveEdge();
        return;
      }
      const total = player.duration;
      if (total > 0.15) {
        player.currentTime = total - 0.1;
      }
      safePause(player);
      setPlaying(false);
      setEnded(true);
      onEnded?.();
    });
    return () => sub.remove();
  }, [player, onEnded, isLive, seekToLiveEdge]);

  useEffect(() => {
    if (!isLive || paused || !appActive) return;
    // Gentle catch-up only when drift is large — frequent seeks cause spinner flashes.
    const interval = setInterval(seekToLiveEdge, 15000);
    return () => clearInterval(interval);
  }, [isLive, paused, appActive, seekToLiveEdge]);

  const togglePlay = () => {
    if (nativeControls) return;
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      if (ended) {
        if (isLive) {
          seekToLiveEdge();
        } else {
          player.currentTime = 0;
          setEnded(false);
        }
      }
      player.play();
      setPlaying(true);
    }
  };

  const CHROME_AUTO_HIDE_MS = 3500;

  const startChromeHideTimer = useCallback(() => {
    if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
    chromeHideTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, CHROME_AUTO_HIDE_MS);
  }, []);

  const handleVideoTap = () => {
    if (nativeControls) return;
    if (enablePlayerChrome) {
      setChromeVisible((visible) => {
        const next = !visible;
        if (next) {
          startChromeHideTimer();
        } else {
          if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
        }
        return next;
      });
      return;
    }
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

  const revealChrome = () => {
    setChromeVisible(true);
    startChromeHideTimer();
  };

  const seekToRatio = (ratio: number) => {
    const total = durationRef.current;
    if (!total) return;
    const next = Math.max(0, Math.min(1, ratio)) * total;
    player.currentTime = next;
    setCurrentTime(next);
  };

  durationRef.current = duration;

  const seekAtX = (x: number) => {
    const width = trackWidthRef.current;
    if (!width || !durationRef.current) return;
    seekToRatio(x / width);
  };

  const scrubPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
          seekAtX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
          seekAtX(evt.nativeEvent.locationX);
        },
      }),
    [player],
  );

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

  const showLoading = isLive
    ? !ready && !nativeControls
    : (!ready || buffering) && !playing && !nativeControls;
  const showPausedOverlay =
    !nativeControls &&
    ready &&
    !playing &&
    !buffering &&
    !chromeVisible &&
    !enablePlayerChrome &&
    !isLive;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const showChromeControls = !nativeControls && chromeVisible && (seekOnTap || enablePlayerChrome);
  const showCornerControls =
    !nativeControls &&
    (enableQualityMenu || enableFullscreen) &&
    !seekOnTap &&
    !enablePlayerChrome &&
    (!fullscreenOn || (fullscreenPresentation === 'inline' && !playing));
  const showSeekAccessoryControls =
    !nativeControls &&
    seekOnTap &&
    !enablePlayerChrome &&
    (enableQualityMenu || enableFullscreen);

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
      {posterUrl && (!ready || (!isLive && !playing && !ended)) ? (
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
      {!nativeControls && (tapToToggle || seekOnTap || enablePlayerChrome) ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleVideoTap}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        />
      ) : null}
      {!nativeControls && enablePlayerChrome && !chromeVisible && !fullscreen && duration > 0 ? (
        <Pressable
          style={styles.miniProgressWrap}
          onPress={revealChrome}
          accessibilityRole="button"
          accessibilityLabel="Show playback controls"
        >
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${progress}%` }]} />
          </View>
        </Pressable>
      ) : null}
      {showChromeControls ? (
        <View
          style={[
            styles.chrome,
            fullscreen && { bottom: 12 + insets.bottom },
            enablePlayerChrome && styles.chromeBackdrop,
          ]}
          pointerEvents="auto"
        >
          <View style={styles.chromeRow}>
            <Pressable
              onPress={() => {
                if (enablePlayerChrome && chromeHideTimerRef.current) {
                  clearTimeout(chromeHideTimerRef.current);
                }
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
          <View
            {...scrubPanResponder.panHandlers}
            onLayout={(e: LayoutChangeEvent) => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            style={styles.trackHitArea}
          >
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${progress}%` }]} />
            </View>
          </View>
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
      {showSeekAccessoryControls ? (
        <View
          style={[styles.seekAccessoryRow, { bottom: cornerBottom }]}
          pointerEvents="box-none"
        >
          <PlayerOverlayControls
            enableQualityMenu={enableQualityMenu}
            enableFullscreen={enableFullscreen}
            enableMute
            isMuted={isVolumeMuted}
            onToggleMute={toggleVolumeMute}
            isFullscreen={fullscreenOn}
            onToggleFullscreen={toggleFullscreen}
            variants={variants}
            selectedVariantUri={selectedVariantUri}
            onQualitySelect={onQualitySelect}
            inline
          />
        </View>
      ) : null}
      {fullscreen && chromeVisible ? (
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
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={toggleFullscreen}
      >
        <StatusBar hidden translucent backgroundColor="transparent" barStyle="light-content" />
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
    width: '100%',
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
  chromeBackdrop: {
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderRadius: radius.lg,
    backgroundColor: withAlpha('#000', 0.55),
  },
  miniProgressWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  miniProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
  trackHitArea: {
    paddingVertical: 12,
    marginVertical: -8,
    justifyContent: 'center',
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
  seekAccessoryRow: {
    position: 'absolute',
    right: 12,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: withAlpha('#000', 0.55),
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
