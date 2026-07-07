import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, radius } from '@/theme/tokens';

const UPLOAD_TYPES = {
  short: { label: 'Short', steps: ['Pick video', 'Title & tags', 'Publish'] },
  video: { label: 'Long video', steps: ['Pick video', 'Details', 'Thumbnail', 'Publish'] },
  movie: { label: 'Movie', steps: ['Pick file', 'Metadata', 'Rights', 'Publish'] },
  podcast: { label: 'Podcast episode', steps: ['Audio/video', 'Show & title', 'Publish'] },
  vertical: { label: 'Vertical episode', steps: ['Pick episode', 'Series & number', 'Publish'] },
} as const;

type UploadType = keyof typeof UPLOAD_TYPES;

export default function SettingsUploadScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const uploadType = (type && type in UPLOAD_TYPES ? type : 'video') as UploadType;
  const config = UPLOAD_TYPES[uploadType];
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title={`Upload ${config.label}`} showSearch={false} showNotifications={false} />
        <View style={styles.steps}>
          {config.steps.map((s, i) => (
            <Text key={s} style={[styles.step, i === step && styles.stepOn, i < step && styles.stepDone]}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>

        {step === 0 && (
          <Card>
            <Text style={styles.cardTitle}>Choose file</Text>
            <Text style={styles.cardSub}>Select a video file from your device to upload.</Text>
            <Button label="Select from library" variant="outline" onPress={() => setStep(1)} style={{ marginTop: 12 }} />
          </Card>
        )}

        {step >= 1 && step < config.steps.length - 1 && (
          <Card>
            <Text style={styles.cardTitle}>{config.steps[step]}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
            <View style={styles.row}>
              {step > 0 && <Button label="Back" variant="outline" onPress={() => setStep(step - 1)} style={styles.flex} />}
              <Button label="Next" onPress={() => setStep(step + 1)} style={styles.flex} disabled={!title.trim()} />
            </View>
          </Card>
        )}

        {step === config.steps.length - 1 && (
          <Card>
            <Text style={styles.cardTitle}>Ready to publish</Text>
            <Text style={styles.cardSub}>{config.label}: {title || 'Untitled'}</Text>
            <Button label="Publish (mock)" onPress={() => setStep(0)} style={{ marginTop: 12 }} />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  steps: { gap: 6, marginBottom: 16 },
  step: { color: colors.mutedForeground, fontSize: 13 },
  stepOn: { color: colors.primary, fontWeight: '700' },
  stepDone: { color: colors.success },
  cardTitle: { color: colors.foreground, fontWeight: '700' },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  flex: { flex: 1 },
});
