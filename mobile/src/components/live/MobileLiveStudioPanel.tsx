import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveCameraPublisher } from '@/components/live/LiveCameraPublisher';
import { Button } from '@/components/ui/Button';
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
};

export function MobileLiveStudioPanel({ stream, mode, viewerCount }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isPublishing, setIsPublishing] = useState(stream.status === 'live');
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
  const { messages, connected, sendMessage } = useStreamChat(stream.id);

  const useCamera = mode === 'camera' && !!stream.studio?.whipPublishUrl;
  const onAir = streamStatus === 'live' || (useCamera && isPublishing);

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

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endStream(stream.id);
      router.replace('/profile');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not end stream');
    } finally {
      setEnding(false);
    }
  };

  const sendChat = () => {
    if (sendMessage(draft)) setDraft('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: colors.primary }]}>Live Studio</Text>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {stream.title}
          </Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: onAir ? colors.live : colors.secondary }]}>
          <Text style={[styles.liveText, { color: colors.onVideo }]}>{onAir ? 'LIVE' : 'PREVIEW'}</Text>
        </View>
      </View>

      <View style={styles.player}>
        {useCamera && stream.studio ? (
          cameraGranted ? (
            <LiveCameraPublisher
              whipPublishUrl={stream.studio.whipPublishUrl}
              streamId={stream.id}
              publishing={isPublishing}
              selectedVideoDeviceId={selectedVideoId}
              selectedAudioDeviceId={selectedAudioId}
              cameraEnabled={cameraOn}
              micEnabled={micOn}
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
          ) : (
            <View style={[styles.obsPlaceholder, { backgroundColor: colors.videoBackground }]}>
              <Ionicons name="camera-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.obsText, { color: colors.mutedForeground }]}>
                Camera and microphone access are required to go live.
              </Text>
              <Button
                label="Allow access"
                onPress={() => {
                  void ensureLiveCameraPermissions().then(setCameraGranted);
                }}
              />
            </View>
          )
        ) : (
          <View style={[styles.obsPlaceholder, { backgroundColor: colors.videoBackground }]}>
            <Ionicons name="desktop-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.obsText, { color: colors.mutedForeground }]}>
              Stream from OBS using your RTMP credentials from Go Live setup.
            </Text>
            {stream.studio ? (
              <>
                <Text style={[styles.code, { color: colors.foreground }]}>{stream.studio.rtmpUrl}</Text>
                <Text style={[styles.code, { color: colors.foreground }]}>{stream.studio.streamKey}</Text>
              </>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {useCamera && !isPublishing ? (
          <Button
            label="Go Live"
            onPress={() => {
              setBroadcastError(null);
              setIsPublishing(true);
            }}
            style={styles.flex}
          />
        ) : null}
        {useCamera && !isPublishing ? (
          <Button
            label={showDevices ? 'Hide devices' : 'Camera & mic'}
            variant="outline"
            onPress={() => setShowDevices((v) => !v)}
            style={styles.flex}
          />
        ) : null}
        {broadcastError ? (
          <Text style={[styles.broadcastHint, { color: colors.destructive }]}>{broadcastError}</Text>
        ) : isPublishing && streamStatus !== 'live' ? (
          <Text style={[styles.broadcastHint, { color: colors.mutedForeground }]}>
            Connecting broadcast… Your stream appears on the Live tab once ingest confirms you are on air.
          </Text>
        ) : streamStatus === 'live' ? (
          <Text style={[styles.broadcastHint, { color: colors.primary }]}>
            You are live — viewers can find you under Live on the website and app.
          </Text>
        ) : null}
        <Button
          label={ending ? 'Ending…' : 'End stream'}
          variant="outline"
          onPress={() => void handleEnd()}
          disabled={ending}
          style={styles.flex}
        />
        <Text style={[styles.viewers, { color: colors.mutedForeground }]}>
          {viewerCount.toLocaleString()} watching
        </Text>
      </View>

      {useCamera && showDevices && !isPublishing ? (
        <View style={[styles.devicePanel, { borderColor: colors.border }]}>
          <Text style={[styles.deviceHeading, { color: colors.foreground }]}>Camera</Text>
          {videoDevices.map((d) => (
            <Pressable
              key={d.deviceId}
              style={[
                styles.deviceRow,
                selectedVideoId === d.deviceId && { backgroundColor: colors.secondary },
              ]}
              onPress={() => setSelectedVideoId(d.deviceId)}
            >
              <Text style={{ color: colors.foreground, fontSize: 13 }} numberOfLines={1}>
                {d.label}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.deviceHeading, { color: colors.foreground, marginTop: 8 }]}>Microphone</Text>
          {audioDevices.map((d) => (
            <Pressable
              key={d.deviceId}
              style={[
                styles.deviceRow,
                selectedAudioId === d.deviceId && { backgroundColor: colors.secondary },
              ]}
              onPress={() => setSelectedAudioId(d.deviceId)}
            >
              <Text style={{ color: colors.foreground, fontSize: 13 }} numberOfLines={1}>
                {d.label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.deviceToggles}>
            <Pressable style={styles.toggleBtn} onPress={() => setCameraOn((v) => !v)}>
              <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontSize: 12 }}>{cameraOn ? 'Camera on' : 'Camera off'}</Text>
            </Pressable>
            <Pressable style={styles.toggleBtn} onPress={() => setMicOn((v) => !v)}>
              <Ionicons name={micOn ? 'mic' : 'mic-off'} size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontSize: 12 }}>{micOn ? 'Mic on' : 'Mic off'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.chat} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {messages.map((m) => (
          <Text key={m.id} style={[styles.chatLine, { color: colors.foreground }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>@{m.user}: </Text>
            {m.message}
          </Text>
        ))}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Say something to chat…"
          placeholderTextColor={colors.mutedForeground}
          value={draft}
          onChangeText={setDraft}
          editable={connected}
          onSubmitEditing={sendChat}
        />
        <Button label="Send" onPress={sendChat} disabled={!draft.trim() || !connected} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.page,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 15, fontWeight: '700' },
  livePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  liveText: { fontSize: 11, fontWeight: '800' },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  obsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  obsText: { textAlign: 'center', fontSize: 13 },
  code: { fontSize: 11, fontFamily: 'monospace' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
  },
  flex: { flexGrow: 1 },
  viewers: { width: '100%', fontSize: 12, marginTop: 4 },
  broadcastHint: { width: '100%', fontSize: 12, lineHeight: 17, marginTop: 4 },
  chat: { flex: 1, paddingHorizontal: spacing.page },
  chatLine: { fontSize: 14, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  devicePanel: {
    marginHorizontal: spacing.page,
    marginBottom: 8,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  deviceHeading: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  deviceRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  deviceToggles: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
