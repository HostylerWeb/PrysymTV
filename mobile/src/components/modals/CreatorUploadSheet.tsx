import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

export type CreatorUploadKind = 'short' | 'video' | 'podcast';

const KIND_META: Record<
  CreatorUploadKind,
  { title: string; hint: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  short: {
    title: 'Upload Short',
    hint: 'Vertical clip, ideally under 60 seconds',
    icon: 'videocam-outline',
  },
  video: {
    title: 'Upload Video',
    hint: 'Long-form horizontal video',
    icon: 'play-circle-outline',
  },
  podcast: {
    title: 'Podcast Episode',
    hint: 'Upload audio or video for your show',
    icon: 'headset-outline',
  },
};

const VIDEO_CATEGORIES = [
  { slug: 'general', label: 'General' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'education', label: 'Education' },
  { slug: 'community', label: 'Community' },
];

const PODCAST_CATEGORIES = ['General', 'Tech', 'True Crime', 'Sports', 'Education'];

const VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
] as const;

type Props = {
  visible: boolean;
  kind: CreatorUploadKind;
  onClose: () => void;
  onSuccess?: () => void;
};

type PickedMedia = { uri: string; name: string; mimeType?: string };

export function CreatorUploadSheet({ visible, kind, onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createUploadStyles);
  const meta = KIND_META[kind];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<PickedMedia | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [podcastMode, setPodcastMode] = useState<'existing' | 'new'>('new');
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [showCategory, setShowCategory] = useState('General');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [podcastMediaType, setPodcastMediaType] = useState<'audio' | 'video'>('audio');
  const [existingShows] = useState<Array<{ id: string; title: string }>>([]);
  const [showId, setShowId] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDescription('');
    setCategory('general');
    setVisibility('public');
    setTags('');
    setFile(null);
    setDone(false);
    setBusy(false);
    setError(null);
    setPodcastMode(existingShows.length ? 'existing' : 'new');
    setShowTitle('');
    setShowDescription('');
    setShowCategory('General');
    setCoverUri(null);
    setPodcastMediaType('audio');
  }, [visible, kind, existingShows.length]);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Media library permission is required.');
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
    }
  };

  const pickPodcastMedia = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: podcastMediaType === 'audio' ? 'audio/*' : 'video/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setFile({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        mimeType: result.assets[0].mimeType ?? undefined,
      });
    }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file) {
      setError('Title and media file are required.');
      return;
    }
    if (kind === 'podcast' && podcastMode === 'new' && !showTitle.trim()) {
      setError('Enter a show title.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Upload API wired in Phase C — validate form then show success
      await new Promise((r) => setTimeout(r, 800));
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 12, maxHeight: '92%' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name={meta.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{meta.title}</Text>
              <Text style={styles.headerHint}>{meta.hint}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {done ? (
              <View style={styles.doneBox}>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                <Text style={styles.doneTitle}>Upload complete</Text>
                <Text style={styles.doneSub}>Your content is ready or processing.</Text>
                <Button label="Done" onPress={onClose} style={{ marginTop: 16, width: '100%' }} />
              </View>
            ) : (
              <>
                {kind === 'podcast' && (
                  <View style={styles.section}>
                    {existingShows.length > 0 && (
                      <View style={styles.segment}>
                        <Pressable
                          style={[styles.segBtn, podcastMode === 'existing' && styles.segBtnOn]}
                          onPress={() => setPodcastMode('existing')}
                        >
                          <Text style={[styles.segText, podcastMode === 'existing' && styles.segTextOn]}>
                            Existing show
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.segBtn, podcastMode === 'new' && styles.segBtnOn]}
                          onPress={() => setPodcastMode('new')}
                        >
                          <Text style={[styles.segText, podcastMode === 'new' && styles.segTextOn]}>
                            New show
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    {podcastMode === 'existing' && existingShows.length > 0 ? (
                      existingShows.map((s) => (
                        <Pressable
                          key={s.id}
                          style={[styles.chip, showId === s.id && styles.chipOn]}
                          onPress={() => setShowId(s.id)}
                        >
                          <Text style={styles.chipText}>{s.title}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <>
                        <Field label="Show title" value={showTitle} onChangeText={setShowTitle} placeholder="Show title" />
                        <Field
                          label="Show description"
                          value={showDescription}
                          onChangeText={setShowDescription}
                          placeholder="Show description"
                          multiline
                        />
                        <Text style={styles.fieldLabel}>Category</Text>
                        <View style={styles.chipRow}>
                          {PODCAST_CATEGORIES.map((c) => (
                            <Pressable
                              key={c}
                              style={[styles.chip, showCategory === c && styles.chipOn]}
                              onPress={() => setShowCategory(c)}
                            >
                              <Text style={styles.chipText}>{c}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <Pressable style={styles.fileBox} onPress={() => void pickCover()}>
                          {coverUri ? (
                            <Image source={{ uri: coverUri }} style={styles.coverPreview} />
                          ) : (
                            <Ionicons name="image-outline" size={28} color={colors.primary} />
                          )}
                          <Text style={styles.fileLabel}>Show cover art</Text>
                        </Pressable>
                      </>
                    )}
                    <View style={styles.segment}>
                      <Pressable
                        style={[styles.segBtn, podcastMediaType === 'audio' && styles.segBtnOn]}
                        onPress={() => { setPodcastMediaType('audio'); setFile(null); }}
                      >
                        <Text style={[styles.segText, podcastMediaType === 'audio' && styles.segTextOn]}>Audio</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.segBtn, podcastMediaType === 'video' && styles.segBtnOn]}
                        onPress={() => { setPodcastMediaType('video'); setFile(null); }}
                      >
                        <Text style={[styles.segText, podcastMediaType === 'video' && styles.segTextOn]}>Video</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                <Field label="Title" value={title} onChangeText={setTitle} placeholder="Title" required />
                <Field
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description (optional)"
                  multiline
                />

                {kind === 'video' && (
                  <>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.chipRow}>
                      {VIDEO_CATEGORIES.map((c) => (
                        <Pressable
                          key={c.slug}
                          style={[styles.chip, category === c.slug && styles.chipOn]}
                          onPress={() => setCategory(c.slug)}
                        >
                          <Text style={styles.chipText}>{c.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {(kind === 'short' || kind === 'video') && (
                  <Field label="Tags" value={tags} onChangeText={setTags} placeholder="Comma-separated tags" />
                )}

                {kind !== 'podcast' && (
                  <>
                    <Text style={styles.fieldLabel}>Visibility</Text>
                    <View style={styles.chipRow}>
                      {VISIBILITY.map((v) => (
                        <Pressable
                          key={v.value}
                          style={[styles.chip, visibility === v.value && styles.chipOn]}
                          onPress={() => setVisibility(v.value)}
                        >
                          <Text style={styles.chipText}>{v.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <Pressable
                  style={[styles.fileBox, file && styles.fileBoxOn]}
                  onPress={() => void (kind === 'podcast' ? pickPodcastMedia() : pickVideo())}
                >
                  <Ionicons
                    name={file ? 'document-attach' : 'cloud-upload-outline'}
                    size={32}
                    color={file ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={styles.fileLabel}>
                    {file?.name ?? (kind === 'podcast' ? 'Select episode file' : 'Select video file')}
                  </Text>
                </Pressable>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  label={busy ? 'Uploading…' : 'Upload'}
                  disabled={busy || !title.trim() || !file}
                  onPress={() => void handleSubmit()}
                  style={{ marginTop: 16, marginBottom: 8 }}
                />
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedInput
        label={`${label}${required ? ' *' : ''}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
      />
    </View>
  );
}

function createUploadStyles(colors: ThemeColors) {
  return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  headerHint: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 20, paddingVertical: 16 },
  section: { marginBottom: 8 },
  fieldLabel: { color: colors.foreground, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.foreground,
    fontSize: 14,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 12,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.background },
  segText: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
  segTextOn: { color: colors.foreground },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipText: { color: colors.foreground, fontSize: 12, fontWeight: '600' },
  fileBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: 8,
    marginBottom: 8,
  },
  fileBoxOn: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  fileLabel: { color: colors.foreground, fontWeight: '600', fontSize: 13 },
  coverPreview: { width: 80, height: 80, borderRadius: radius.md },
  error: { color: colors.destructive, fontSize: 13, marginTop: 8 },
  doneBox: { alignItems: 'center', paddingVertical: 32 },
  doneTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700', marginTop: 12 },
  doneSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  });
}
