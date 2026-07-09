import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { endStream, fetchStreamIngestHealth, initStream } from '@/lib/api/streams';
import { colors, radius } from '@/theme/tokens';

type StreamMode = 'camera' | 'obs';

export default function GoLiveScreen() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [mode, setMode] = useState<StreamMode>('obs');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [healthMsg, setHealthMsg] = useState<string | null>(null);
  const approved = user?.streamerStatus === 'approved';

  const startStream = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Enter a stream title before going live.');
      return;
    }
    setBusy(true);
    try {
      const res = await initStream({ title: title.trim(), category: category.trim() || undefined });
      setActiveStreamId(res.streamId);
      setStreamKey(res.streamKey);
      setServerUrl(res.rtmpUrl);
      Alert.alert('Stream ready', 'Use the server URL and stream key in OBS, then start your encoder.');
    } catch (e) {
      Alert.alert('Could not start', e instanceof Error ? e.message : 'Stream init failed');
    } finally {
      setBusy(false);
    }
  };

  const checkHealth = async () => {
    setBusy(true);
    try {
      const health = await fetchStreamIngestHealth();
      const message =
        typeof health.message === 'string'
          ? health.message
          : health.ok
            ? 'Ingest is reachable.'
            : 'Ingest health check completed.';
      setHealthMsg(message);
    } catch (e) {
      setHealthMsg(e instanceof Error ? e.message : 'Health check failed');
    } finally {
      setBusy(false);
    }
  };

  const finishStream = async () => {
    if (!activeStreamId) return;
    setBusy(true);
    try {
      await endStream(activeStreamId);
      setActiveStreamId(null);
      Alert.alert('Stream ended', 'Your broadcast has been stopped.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not end stream');
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
            <>
              <Card>
                <Text style={styles.title}>Go live setup</Text>
                <View style={styles.modeRow}>
                  {(['camera', 'obs'] as const).map((m) => (
                    <Pressable
                      key={m}
                      style={[styles.modeBtn, mode === m && styles.modeBtnOn]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.modeText, mode === m && styles.modeTextOn]}>
                        {m === 'camera' ? 'Camera' : 'OBS / Encoder'}
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
                <TextInput
                  style={styles.input}
                  placeholder="Category (e.g. Gaming, Music)"
                  placeholderTextColor={colors.mutedForeground}
                  value={category}
                  onChangeText={setCategory}
                />
                {healthMsg ? <Text style={styles.hintBanner}>{healthMsg}</Text> : null}
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Text style={styles.title}>{mode === 'camera' ? 'Live studio' : 'Encoder settings'}</Text>
                {mode === 'camera' ? (
                  <>
                    <Text style={styles.sub}>
                      Mobile camera streaming uses the same RTMP ingest. Generate keys below and use a compatible encoder app.
                    </Text>
                    <Button label="Generate stream key" onPress={() => void startStream()} disabled={busy} style={{ marginTop: 12 }} />
                  </>
                ) : (
                  <>
                    <Text style={styles.sub}>Copy these into OBS or your RTMP encoder:</Text>
                    {serverUrl ? <Text style={styles.code}>{serverUrl}</Text> : null}
                    {streamKey ? <Text style={styles.code}>{streamKey}</Text> : (
                      <Text style={styles.sub}>Generate a stream key to get RTMP credentials.</Text>
                    )}
                    <View style={styles.row}>
                      <Button
                        label={busy ? 'Working…' : 'Generate key'}
                        variant="secondary"
                        onPress={() => void startStream()}
                        disabled={busy}
                        style={styles.flex}
                      />
                      <Button
                        label="Copy"
                        variant="outline"
                        onPress={copyIngest}
                        disabled={!streamKey}
                        style={styles.flex}
                      />
                    </View>
                    <Button label="Check ingest health" variant="ghost" style={{ marginTop: 8 }} onPress={() => void checkHealth()} disabled={busy} />
                    <Button
                      label="End stream"
                      variant="outline"
                      style={{ marginTop: 8 }}
                      onPress={() => void finishStream()}
                      disabled={!activeStreamId || busy}
                    />
                  </>
                )}
              </Card>

              {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}

              <Button
                label="Open creator dashboard"
                variant="outline"
                onPress={() => router.push('/creator-dashboard')}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </View>
      </ScrollView>
      <StreamerApplicationModal visible={applyOpen} onClose={() => setApplyOpen(false)} features={['live']} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 13, marginVertical: 12 },
  modeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  modeBtnOn: { backgroundColor: colors.primary + '22' },
  modeText: { color: colors.mutedForeground, fontWeight: '600' },
  modeTextOn: { color: colors.primary },
  input: {
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    color: colors.foreground,
    marginBottom: 8,
  },
  hintBanner: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  code: { color: colors.primary, fontFamily: 'monospace', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  flex: { flex: 1 },
});
