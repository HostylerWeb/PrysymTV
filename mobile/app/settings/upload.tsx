import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { runVideoUpload } from '@/lib/api/videos';
import { uploadQueuedBodyFor } from '@/lib/upload-processing-copy';
import { colors, radius } from '@/theme/tokens';

const UPLOAD_TYPES = {
  short: { label: 'Short', steps: ['Pick video', 'Title & tags', 'Publish'], videoType: 'short' as const },
  video: { label: 'Long video', steps: ['Pick video', 'Details', 'Thumbnail', 'Publish'], videoType: 'video' as const },
  movie: { label: 'Movie', steps: ['Pick file', 'Metadata', 'Rights', 'Publish'], videoType: 'movie' as const },
  podcast: { label: 'Podcast episode', steps: ['Audio/video', 'Show & title', 'Publish'], videoType: null },
  vertical: { label: 'Vertical episode', steps: ['Pick episode', 'Series & number', 'Publish'], videoType: null },
} as const;

type UploadType = keyof typeof UPLOAD_TYPES;

export default function SettingsUploadScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const uploadType = (type && type in UPLOAD_TYPES ? type : 'video') as UploadType;
  const config = UPLOAD_TYPES[uploadType];
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'custom'>('custom');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow media library access to pick a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setFile({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName ?? 'video.mp4',
        mimeType: result.assets[0].mimeType ?? 'video/mp4',
      });
      setStep(1);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const publish = async () => {
    if (!config.videoType || !file || !title.trim()) return;
    if (
      uploadType === 'video' &&
      thumbnailMode === 'custom' &&
      !thumbnailUri
    ) {
      Alert.alert('Thumbnail required', 'Choose an image or use auto from video.');
      return;
    }
    setBusy(true);
    setUploadPercent(0);
    try {
      await runVideoUpload({
        type: config.videoType,
        title: title.trim(),
        description: description.trim() || undefined,
        file,
        thumbnailFile:
          uploadType === 'video' && thumbnailMode === 'custom' && thumbnailUri
            ? { uri: thumbnailUri, name: 'thumbnail.jpg', mimeType: 'image/jpeg' }
            : undefined,
        onProgress: setUploadPercent,
      });
      Alert.alert(
        'Upload received',
        uploadQueuedBodyFor(config.videoType === 'short' ? 'short' : config.videoType === 'movie' ? 'movie' : 'video'),
      );
      setStep(0);
      setTitle('');
      setDescription('');
      setFile(null);
      setThumbnailMode('custom');
      setThumbnailUri(null);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload');
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

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

        {!config.videoType ? (
          <Card>
            <Text style={styles.cardTitle}>Use creator tools</Text>
            <Text style={styles.cardSub}>
              {uploadType === 'podcast'
                ? 'Upload podcast episodes from Settings → Podcasts.'
                : 'Upload vertical episodes from Settings → Verticals.'}
            </Text>
            <Button
              label={uploadType === 'podcast' ? 'Open Podcasts' : 'Open Verticals'}
              onPress={() => router.replace(uploadType === 'podcast' ? '/settings/podcasts' : '/settings/verticals')}
              style={{ marginTop: 12 }}
            />
          </Card>
        ) : null}

        {config.videoType && step === 0 && (
          <Card>
            <Text style={styles.cardTitle}>Choose file</Text>
            <Text style={styles.cardSub}>Select a video file from your device to upload.</Text>
            <Button label="Select from library" variant="outline" onPress={() => void pickVideo()} style={{ marginTop: 12 }} />
          </Card>
        )}

        {config.videoType && step >= 1 && step < config.steps.length - 1 && uploadType !== 'video' && (
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
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.row}>
              {step > 0 && <Button label="Back" variant="outline" onPress={() => setStep(step - 1)} style={styles.flex} />}
              <Button label="Next" onPress={() => setStep(step + 1)} style={styles.flex} disabled={!title.trim()} />
            </View>
          </Card>
        )}

        {config.videoType && uploadType === 'video' && step === 1 && (
          <Card>
            <Text style={styles.cardTitle}>Details</Text>
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
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.row}>
              <Button label="Back" variant="outline" onPress={() => setStep(0)} style={styles.flex} />
              <Button label="Next" onPress={() => setStep(2)} style={styles.flex} disabled={!title.trim()} />
            </View>
          </Card>
        )}

        {config.videoType && uploadType === 'video' && step === 2 && (
          <Card>
            <Text style={styles.cardTitle}>Thumbnail</Text>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segBtn, thumbnailMode === 'auto' && styles.segBtnOn]}
                onPress={() => {
                  setThumbnailMode('auto');
                  setThumbnailUri(null);
                }}
              >
                <Text style={[styles.segText, thumbnailMode === 'auto' && styles.segTextOn]}>
                  Auto from video
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segBtn, thumbnailMode === 'custom' && styles.segBtnOn]}
                onPress={() => setThumbnailMode('custom')}
              >
                <Text style={[styles.segText, thumbnailMode === 'custom' && styles.segTextOn]}>
                  Upload image
                </Text>
              </Pressable>
            </View>
            {thumbnailMode === 'auto' ? (
              <Text style={styles.cardSub}>
                We&apos;ll grab a frame from your video after processing.
              </Text>
            ) : (
              <Pressable style={styles.thumbBox} onPress={() => void pickThumbnail()}>
                {thumbnailUri ? (
                  <Image source={{ uri: thumbnailUri }} style={styles.thumbPreview} />
                ) : (
                  <Ionicons name="image-outline" size={32} color={colors.primary} />
                )}
                <Text style={styles.cardSub}>Tap to choose thumbnail image</Text>
              </Pressable>
            )}
            <View style={styles.row}>
              <Button label="Back" variant="outline" onPress={() => setStep(1)} style={styles.flex} />
              <Button
                label="Next"
                onPress={() => setStep(3)}
                style={styles.flex}
                disabled={thumbnailMode === 'custom' && !thumbnailUri}
              />
            </View>
          </Card>
        )}

        {config.videoType && step === config.steps.length - 1 && (
          <Card>
            <Text style={styles.cardTitle}>Ready to publish</Text>
            <Text style={styles.cardSub}>{config.label}: {title || 'Untitled'}</Text>
            <Button
              label={
                busy
                  ? uploadPercent != null
                    ? `Uploading ${uploadPercent}%`
                    : 'Uploading…'
                  : 'Publish'
              }
              onPress={() => void publish()}
              disabled={busy || !file}
              style={{ marginTop: 12 }}
            />
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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.background },
  segText: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
  segTextOn: { color: colors.foreground },
  thumbBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  thumbPreview: { width: 120, height: 68, borderRadius: radius.md, marginBottom: 8 },
});
