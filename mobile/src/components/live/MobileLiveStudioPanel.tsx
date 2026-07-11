import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveCameraPublisher } from '@/components/live/LiveCameraPublisher';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { endStream, fetchStream } from '@/lib/api/streams';
import type { StreamDetail } from '@/lib/api/streams';
import { ensureLiveCameraPermissions } from '@/lib/camera-permissions';
import { useStreamChat } from '@/hooks/useStreamChat';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Props = {
  stream: StreamDetail & { studio?: { whipPublishUrl: string; rtmpUrl: string; streamKey: string } };
  mode: 'camera' | 'obs';
  viewerCount: number;
  playbackUrl?: string | null;
};

export function MobileLiveStudioPanel({ stream, mode, viewerCount, playbackUrl }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const chatRef = useRef<ScrollView>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [streamStatus, setStreamStatus] = useState(stream.status);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [draft, setDraft] = useState('');
  const [cameraGranted, setCameraGranted] = useState(mode !== 'camera');
  const [showDevices, setShowDevices] = useState(false);
  const [videoDevices, setVideoDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [audioDevices, setAudioDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mirrorPreview, setMirrorPreview] = useState(true);
  const { messages, connected, sendMessage } = useStreamChat(stream.id);

  const useCamera = mode === 'camera' && !!stream.studio?.whipPublishUrl;
  const showObsPlayer = mode === 'obs' && Boolean(playbackUrl) && streamStatus === 'live';
  const onAir = useCamera
    ? isPublishing && streamStatus === 'live'
    : mode === 'obs'
      ? streamStatus === 'live' && Boolean(playbackUrl)
      : streamStatus === 'live';

  const chatPanelHeight = Math.round(
    windowHeight * (onAir || isPublishing ? 0.34 : 0.24),
  );
  const deviceSheetHeight = Math.min(Math.round(windowHeight * 0.56), 440);

  useEffect(() => {
    if (!useCamera) return;
    let cancelled = false;
    void ensureLiveCameraPermissions().then((granted) => {
      if (!cancelled) setCameraGranted(granted);
    });
    return () => {
      cancelled = true;
    };
  }, [useCamera]);

  useEffect(() => {
    if (!isPublishing && streamStatus !== 'live') return;
    let cancelled = false;
    const poll = () => {
      void fetchStream(stream.id)
        .then((detail) => {
          if (!cancelled) setStreamStatus(detail.status);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isPublishing, stream.id, streamStatus]);

  useEffect(() => {
    if (!isPublishing || streamStatus === 'live') return;
    const warn = setTimeout(() => {
      setBroadcastError(
        Platform.OS === 'web'
          ? 'Broadcast has not gone live yet. On Expo web, allow camera access and ensure MediaMTX accepts your origin. For production, redeploy MediaMTX after the latest config update, or use the Prysym TV website / native app to go live.'
          : 'Broadcast has not connected yet. Check your network and try tapping Go Live again.',
      );
    }, 20_000);
    return () => clearTimeout(warn);
  }, [isPublishing, streamStatus]);

  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const handleEnd = async () => {
    Alert.alert('End live stream?', 'Viewers will see the broadcast has ended.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End stream',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setEnding(true);
            try {
              await endStream(stream.id);
              router.replace('/profile');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not end stream');
            } finally {
              setEnding(false);
            }
          })();
        },
      },
    ]);
  };

  const sendChat = () => {
    if (sendMessage(draft)) setDraft('');
  };

  const renderStageContent = () => {
    if (useCamera && stream.studio) {
      if (!cameraGranted) {
        return (
          <View style={[styles.placeholder, { backgroundColor: colors.videoBackground }]}>
            <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
              Camera and microphone access are required to go live.
            </Text>
            <Button
              label="Allow access"
              onPress={() => {
                void ensureLiveCameraPermissions().then(setCameraGranted);
              }}
            />
          </View>
        );
      }
      return (
        <LiveCameraPublisher
          whipPublishUrl={stream.studio.whipPublishUrl}
          streamId={stream.id}
          publishing={isPublishing}
          selectedVideoDeviceId={selectedVideoId}
          selectedAudioDeviceId={selectedAudioId}
          cameraEnabled={cameraOn}
          micEnabled={micOn}
          mirrorPreview={mirrorPreview}
          onDevices={({ videoDevices: v, audioDevices: a }) => {
            setVideoDevices(v);
            setAudioDevices(a);
            if (!selectedVideoId && v[0]?.deviceId) setSelectedVideoId(v[0].deviceId);
            if (!selectedAudioId && a[0]?.deviceId) setSelectedAudioId(a[0].deviceId);
          }}
          onConnected={() => {
            setIsPublishing(true);
            setBroadcastError(null);
            void fetchStream(stream.id).then((detail) => setStreamStatus(detail.status));
          }}
          onError={(msg: string) => {
            setBroadcastError(msg);
            Alert.alert('Broadcast error', msg);
          }}
        />
      );
    }

    if (showObsPlayer && playbackUrl) {
      return (
        <HlsPlayer
          source={playbackUrl}
          autoPlay
          posterUrl={stream.thumbnail}
          contentFit="contain"
        />
      );
    }

    return (
      <View style={[styles.placeholder, { backgroundColor: colors.videoBackground }]}>
        <Ionicons name="desktop-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
          {streamStatus === 'live'
            ? 'Waiting for playback signal…'
            : 'Stream from OBS using your RTMP credentials below. Start streaming in OBS, then your picture appears here.'}
        </Text>
        {stream.studio ? (
          <>
            <Text style={[styles.code, { color: colors.foreground }]}>{stream.studio.rtmpUrl}</Text>
            <Text style={[styles.code, { color: colors.foreground }]}>{stream.studio.streamKey}</Text>
          </>
        ) : null}
        {streamStatus === 'scheduled' ? (
          <Text style={[styles.obsWaiting, { color: colors.mutedForeground }]}>
            Waiting for OBS to connect…
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {/* Full-size camera / playback stage */}
      <View style={styles.stage}>
        {renderStageContent()}

        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.35)', 'transparent']}
          style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        >
          <Pressable onPress={() => router.back()} style={styles.overlayBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.kicker}>Live Studio</Text>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {stream.title}
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: onAir ? colors.live : 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.liveDot, onAir && styles.liveDotPulse]} />
            <Text style={styles.liveText}>{onAir ? 'LIVE' : isPublishing ? 'ON' : 'PREVIEW'}</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
          style={styles.bottomOverlay}
        >
          {broadcastError ? (
            <Text style={styles.hintError} numberOfLines={2}>
              {broadcastError}
            </Text>
          ) : isPublishing && streamStatus !== 'live' ? (
            <Text style={styles.hint}>Connecting broadcast…</Text>
          ) : onAir ? (
            <Text style={styles.hintLive}>You are live — viewers can watch on Live</Text>
          ) : useCamera ? (
            <Text style={styles.hint}>Check framing, then tap Go Live when ready</Text>
          ) : null}

          <View style={styles.controlRow}>
            {useCamera && isPublishing ? (
              <>
                <Pressable style={styles.iconBtn} onPress={() => setCameraOn((v) => !v)}>
                  <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setMicOn((v) => !v)}>
                  <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
                </Pressable>
              </>
            ) : null}

            <View style={styles.viewerChip}>
              <Ionicons name="people" size={14} color="#fff" />
              <Text style={styles.viewerChipText}>{viewerCount.toLocaleString()}</Text>
            </View>

            <View style={styles.controlSpacer} />

            {useCamera && !isPublishing ? (
              <>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => setShowDevices(true)}
                >
                  <Ionicons name="settings-outline" size={22} color="#fff" />
                </Pressable>
                <Pressable
                  style={[styles.goLiveBtn, { backgroundColor: colors.live }]}
                  onPress={() => {
                    setShowDevices(false);
                    setBroadcastError(null);
                    setIsPublishing(true);
                  }}
                >
                  <Ionicons name="radio" size={18} color="#fff" />
                  <Text style={styles.goLiveText}>Go Live</Text>
                </Pressable>
              </>
            ) : null}

            {(isPublishing || streamStatus === 'live') && (
              <Pressable
                style={[styles.endBtn, ending && styles.endBtnDisabled]}
                onPress={() => void handleEnd()}
                disabled={ending}
              >
                <Text style={styles.endBtnText}>{ending ? 'Ending…' : 'End'}</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

      </View>

      {/* Chat panel — fixed height so preview keeps most of the screen */}
      <View
        style={[
          styles.chatPanel,
          {
            height: chatPanelHeight,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: colors.foreground }]}>Live chat</Text>
          <Text style={[styles.chatMeta, { color: colors.mutedForeground }]}>
            {connected ? 'Connected' : 'Connecting…'}
          </Text>
        </View>

        <ScrollView
          ref={chatRef}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Text style={[styles.chatEmpty, { color: colors.mutedForeground }]}>
              {onAir || isPublishing
                ? 'Messages and gifts from viewers appear here.'
                : 'Chat opens once you go live.'}
            </Text>
          ) : (
            messages.map((m) => (
              <Text key={m.id} style={[styles.chatLine, { color: colors.foreground }]}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>@{m.user} </Text>
                {m.message}
              </Text>
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
            placeholder={onAir || isPublishing ? 'Reply to chat…' : 'Chat available when live'}
            placeholderTextColor={colors.mutedForeground}
            value={draft}
            onChangeText={setDraft}
            editable={connected && (onAir || isPublishing)}
            onSubmitEditing={sendChat}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              (!draft.trim() || !connected) && styles.sendBtnDisabled,
            ]}
            onPress={sendChat}
            disabled={!draft.trim() || !connected}
          >
            <Ionicons name="send" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      <BottomSheet
        visible={useCamera && showDevices && !isPublishing}
        onClose={() => setShowDevices(false)}
        title="Camera & microphone"
        height={deviceSheetHeight}
        scroll
      >
        <View style={[styles.mirrorRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <View style={styles.mirrorCopy}>
            <Text style={[styles.mirrorTitle, { color: colors.foreground }]}>Mirror preview</Text>
            <Text style={[styles.mirrorHint, { color: colors.mutedForeground }]}>
              Flips your on-screen preview like a selfie camera. Viewers still see the normal image.
            </Text>
          </View>
          <Switch
            value={mirrorPreview}
            onValueChange={setMirrorPreview}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <Text style={[styles.deviceHeading, { color: colors.foreground }]}>Camera</Text>
        {videoDevices.length === 0 ? (
          <Text style={[styles.deviceEmpty, { color: colors.mutedForeground }]}>
            No cameras detected yet.
          </Text>
        ) : (
          videoDevices.map((d) => {
            const selected = selectedVideoId === d.deviceId;
            return (
              <Pressable
                key={d.deviceId}
                style={[
                  styles.deviceRow,
                  { borderColor: colors.border },
                  selected && { backgroundColor: colors.secondary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedVideoId(d.deviceId)}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.deviceLabel, { color: colors.foreground }]} numberOfLines={2}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })
        )}

        <Text style={[styles.deviceHeading, { color: colors.foreground, marginTop: 16 }]}>
          Microphone
        </Text>
        {audioDevices.length === 0 ? (
          <Text style={[styles.deviceEmpty, { color: colors.mutedForeground }]}>
            No microphones detected yet.
          </Text>
        ) : (
          audioDevices.map((d) => {
            const selected = selectedAudioId === d.deviceId;
            return (
              <Pressable
                key={d.deviceId}
                style={[
                  styles.deviceRow,
                  { borderColor: colors.border },
                  selected && { backgroundColor: colors.secondary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedAudioId(d.deviceId)}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.deviceLabel, { color: colors.foreground }]} numberOfLines={2}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stage: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  placeholderText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  obsWaiting: { textAlign: 'center', fontSize: 12, marginTop: 8 },
  code: { fontSize: 11, fontFamily: 'monospace' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.page,
    paddingBottom: 16,
  },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' },
  streamTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveDotPulse: {
    opacity: 1,
  },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.page,
    paddingTop: 24,
    paddingBottom: 14,
  },
  hint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  hintLive: { color: '#86efac', fontSize: 12, marginBottom: 10, textAlign: 'center', fontWeight: '600' },
  hintError: { color: '#fca5a5', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  viewerChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  controlSpacer: { flex: 1 },
  goLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  goLiveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  endBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(200,0,53,0.9)',
  },
  endBtnDisabled: { opacity: 0.6 },
  endBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deviceHeading: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  mirrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  mirrorCopy: { flex: 1 },
  mirrorTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  mirrorHint: { fontSize: 12, lineHeight: 17 },
  deviceEmpty: { fontSize: 13, marginBottom: 8 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  deviceLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  chatPanel: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.page,
    paddingTop: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chatTitle: { fontSize: 14, fontWeight: '700' },
  chatMeta: { fontSize: 11 },
  chatList: { flex: 1 },
  chatListContent: { paddingBottom: 8, flexGrow: 1 },
  chatEmpty: { fontSize: 13, textAlign: 'center', paddingVertical: 16, lineHeight: 18 },
  chatLine: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
