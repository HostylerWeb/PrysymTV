import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius } from '@/theme/tokens';

type StreamMode = 'camera' | 'obs';

export default function GoLiveScreen() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [mode, setMode] = useState<StreamMode>('camera');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [streamKey, setStreamKey] = useState('stream-key-mock-xxxx');
  const approved = user?.streamerStatus === 'approved';
  const serverUrl = 'rtmp://mock.ingest.prysym.tv/live';

  const regenerateKey = () => {
    setStreamKey(`stream-key-${Math.random().toString(36).slice(2, 10)}`);
    Alert.alert('Stream key regenerated', 'Update your encoder with the new key.');
  };

  const copyIngest = () => {
    Alert.alert('Copied (mock)', `${serverUrl}\n${streamKey}`);
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
                <Text style={styles.hintBanner}>
                  Ingest health: mock endpoint reachable. Real status from GET /streams/health in Phase C.
                </Text>
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Text style={styles.title}>{mode === 'camera' ? 'Live studio' : 'Encoder settings'}</Text>
                {mode === 'camera' ? (
                  <>
                    <View style={styles.preview}>
                      <Text style={styles.previewText}>Camera preview placeholder</Text>
                    </View>
                    <Button label="Open Live Studio" style={{ marginTop: 12 }} />
                    <Button label="Start broadcast (mock)" variant="secondary" style={{ marginTop: 8 }} />
                  </>
                ) : (
                  <>
                    <Text style={styles.sub}>Copy these into OBS or your RTMP encoder:</Text>
                    <Text style={styles.code}>{serverUrl}</Text>
                    <Text style={styles.code}>{streamKey}</Text>
                    <View style={styles.row}>
                      <Button label="Copy server & key" variant="secondary" onPress={copyIngest} style={styles.flex} />
                      <Button label="Regenerate key" variant="outline" onPress={regenerateKey} style={styles.flex} />
                    </View>
                    <Button label="Check ingest health" variant="ghost" style={{ marginTop: 8 }} />
                    <Button label="End stream" variant="outline" style={{ marginTop: 8 }} />
                  </>
                )}
              </Card>

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
  preview: { height: 160, backgroundColor: colors.secondary, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  previewText: { color: colors.mutedForeground, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  flex: { flex: 1 },
});
