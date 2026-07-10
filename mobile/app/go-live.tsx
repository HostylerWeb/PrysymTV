import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { initStream } from '@/lib/api/streams';
import { colors, radius } from '@/theme/tokens';

type StreamMode = 'camera' | 'obs';

const CATEGORIES = ['Gaming', 'Music', 'Technology', 'Fitness', 'Talk'];

export default function GoLiveScreen() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [mode, setMode] = useState<StreamMode>('camera');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [streamId, setStreamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const approved = user?.streamerStatus === 'approved';

  const openStudio = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a stream title before opening Live Studio.');
      return;
    }
    if (streamId && mode === 'camera') {
      router.push(`/live/${streamId}?studio=camera` as never);
      return;
    }
    if (streamId && mode === 'obs') {
      router.push(`/live/${streamId}?studio=obs` as never);
      return;
    }
    setBusy(true);
    try {
      const res = await initStream({ title: title.trim(), category: category.trim() || undefined });
      setStreamId(res.streamId);
      setStreamKey(res.streamKey);
      setServerUrl(res.rtmpUrl);
      router.push(`/live/${res.streamId}?studio=${mode}` as never);
    } catch (e) {
      Alert.alert('Could not start', e instanceof Error ? e.message : 'Stream init failed');
    } finally {
      setBusy(false);
    }
  };

  const generateObsKey = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a stream title first.');
      return;
    }
    setBusy(true);
    try {
      const res = await initStream({ title: title.trim(), category: category.trim() || undefined });
      setStreamId(res.streamId);
      setStreamKey(res.streamKey);
      setServerUrl(res.rtmpUrl);
    } catch (e) {
      Alert.alert('Could not start', e instanceof Error ? e.message : 'Stream init failed');
    } finally {
      setBusy(false);
    }
  };

  const copyIngest = () => {
    Alert.alert('RTMP settings', `Server: ${serverUrl}\nStream key: ${streamKey}`);
  };

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title="Go Live" showSearch={false} showNotifications={false} />
          {!approved ? (
            <Card>
              <Text style={styles.title}>Streamer access required</Text>
              <Text style={styles.sub}>Apply for live streaming before you can broadcast.</Text>
              <Button label="Apply to stream" onPress={() => setApplyOpen(true)} style={{ marginTop: 12 }} />
            </Card>
          ) : (
            <Card>
              <Text style={styles.sub}>
                Go live from your phone with camera and mic — no extra software required. OBS is optional
                for creators who need scenes, overlays, or capture hardware.
              </Text>

              <View style={styles.modeRow}>
                {(['camera', 'obs'] as const).map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.modeCard, mode === m && styles.modeCardOn]}
                    onPress={() => setMode(m)}
                  >
                    <Text style={[styles.modeTitle, mode === m && styles.modeTitleOn]}>
                      {m === 'camera' ? 'Camera & mic' : 'OBS Studio'}
                    </Text>
                    <Text style={styles.modeHint}>
                      {m === 'camera'
                        ? 'Recommended — open Live Studio on your phone.'
                        : 'Optional — multi-source layouts and overlays.'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Stream title"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.categoryChip, category === c && styles.categoryChipOn]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.categoryText, category === c && styles.categoryTextOn]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'obs' && streamKey ? (
                <View style={styles.rtmpBox}>
                  <Text style={styles.rtmpLabel}>Server</Text>
                  <Text style={styles.code}>{serverUrl}</Text>
                  <Text style={[styles.rtmpLabel, { marginTop: 8 }]}>Stream key</Text>
                  <Text style={styles.code}>{streamKey}</Text>
                </View>
              ) : null}

              {mode === 'camera' ? (
                <Button
                  label={busy ? 'Opening…' : 'Open Live Studio'}
                  onPress={() => void openStudio()}
                  disabled={!title.trim() || busy}
                  style={{ marginTop: 16 }}
                />
              ) : streamKey ? (
                <View style={styles.row}>
                  <Button label="Copy server & key" variant="secondary" onPress={copyIngest} style={styles.flex} />
                  <Button label="Open Live Studio" onPress={() => void openStudio()} disabled={busy} style={styles.flex} />
                </View>
              ) : (
                <Button
                  label={busy ? 'Generating…' : 'Generate stream key'}
                  onPress={() => void generateObsKey()}
                  disabled={!title.trim() || busy}
                  style={{ marginTop: 16 }}
                />
              )}

              <Text style={styles.hint}>
                {mode === 'camera'
                  ? Platform.OS === 'web'
                    ? 'Enter a title and open Live Studio to preview your camera and mic. Tap Go Live when ready. For the most reliable broadcast, use the Prysym TV website or an Android/iOS build — Expo web preview depends on MediaMTX accepting your browser origin.'
                    : 'Enter a title and open Live Studio to preview your camera and mic. When everything looks good, tap Go Live in the studio — viewers won\'t see you until then.'
                  : 'In OBS use Custom service with the server URL and stream key above. Keep Live Studio open for chat and gifts.'}
              </Text>

              {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
            </Card>
          )}
        </View>
      </ScrollView>
      <StreamerApplicationModal visible={applyOpen} onClose={() => setApplyOpen(false)} features={['live']} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16, paddingBottom: 32 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary + '55',
  },
  modeCardOn: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  modeTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  modeTitleOn: { color: colors.primary },
  modeHint: { color: colors.mutedForeground, fontSize: 11, lineHeight: 15, marginTop: 4 },
  input: {
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    color: colors.foreground,
    marginBottom: 12,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  categoryChipOn: { backgroundColor: colors.primary + '22' },
  categoryText: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
  categoryTextOn: { color: colors.primary },
  rtmpBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary + '88',
  },
  rtmpLabel: { color: colors.mutedForeground, fontSize: 11, fontWeight: '600' },
  code: { color: colors.foreground, fontFamily: 'monospace', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  flex: { flex: 1 },
  hint: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 16 },
});
