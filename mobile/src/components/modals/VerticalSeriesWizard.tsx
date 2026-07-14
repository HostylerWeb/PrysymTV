import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { createVerticalSeries, createVerticalEpisode, attachVerticalEpisodeVideo } from '@/lib/api/verticals';
import { runVideoUpload } from '@/lib/api/videos';
import { uploadQueuedBodyFor } from '@/lib/upload-processing-copy';
import { colors, radius } from '@/theme/tokens';

const GENRES = ['Drama', 'Romance', 'Thriller', 'Comedy', 'Fantasy', 'Action', 'Mystery'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  initialIntent?: 'choose' | 'new_series' | 'add_episode';
  seriesSlug?: string;
};

type Mode = 'choose' | 'series' | 'episode' | 'done';

type PickedVideo = { uri: string; name: string; mimeType?: string };

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function VerticalSeriesWizard({
  visible,
  onClose,
  onComplete,
  initialIntent = 'choose',
  seriesSlug: initialSeriesSlug,
}: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesSlug, setSeriesSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Drama');
  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [cliffhanger, setCliffhanger] = useState('');
  const [videoFile, setVideoFile] = useState<PickedVideo | null>(null);
  const [activeSeriesSlug, setActiveSeriesSlug] = useState('');
  const [doneMessage, setDoneMessage] = useState('Your micro-drama series is ready.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode(
      initialIntent === 'new_series'
        ? 'series'
        : initialIntent === 'add_episode'
          ? 'episode'
          : 'choose',
    );
    setSeriesTitle('');
    setSeriesSlug('');
    setSlugTouched(false);
    setTagline('');
    setDescription('');
    setGenre('Drama');
    setPosterUri(null);
    setEpisodeNumber('1');
    setEpisodeTitle('');
    setCliffhanger('');
    setVideoFile(null);
    setActiveSeriesSlug(initialSeriesSlug ?? '');
    setDoneMessage('Your micro-drama series is ready.');
    setError(null);
    setBusy(false);
  }, [visible, initialIntent, initialSeriesSlug]);

  useEffect(() => {
    if (slugTouched) return;
    if (seriesTitle.trim()) setSeriesSlug(slugifyTitle(seriesTitle));
  }, [seriesTitle, slugTouched]);

  const pickPoster = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) setPosterUri(result.assets[0].uri);
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideoFile({
        uri: asset.uri,
        name: asset.fileName ?? 'episode.mp4',
        mimeType: asset.mimeType ?? 'video/mp4',
      });
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'series') {
        if (!seriesTitle.trim() || !seriesSlug.trim()) return;
        await createVerticalSeries({
          slug: seriesSlug.trim(),
          title: seriesTitle.trim(),
          tagline: tagline.trim() || undefined,
          description: description.trim() || undefined,
          genre,
        });
        setActiveSeriesSlug(seriesSlug.trim());
        setDoneMessage('Series created. Add episodes from Micro-dramas settings.');
        setMode('done');
        return;
      }

      if (mode === 'episode') {
        const slug = activeSeriesSlug || initialSeriesSlug;
        if (!slug) {
          setError('Select a series before uploading an episode.');
          return;
        }
        if (!episodeTitle.trim() || !videoFile) {
          setError('Episode title and video are required.');
          return;
        }
        const epNum = Math.max(1, parseInt(episodeNumber, 10) || 1);
        const ep = await createVerticalEpisode(slug, {
          episodeNumber: epNum,
          title: episodeTitle.trim(),
          cliffhanger: cliffhanger.trim() || undefined,
        });
        const uploaded = await runVideoUpload({
          type: 'video',
          title: episodeTitle.trim(),
          file: videoFile,
          verticalEpisodeId: ep.id,
        });
        await attachVerticalEpisodeVideo(ep.id, uploaded.videoId);
        setDoneMessage(uploadQueuedBodyFor('vertical episode'));
        setMode('done');
        onComplete?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    onClose();
  };

  if (mode === 'done') {
    return (
      <BottomSheet visible={visible} onClose={reset} title="Done">
        <Text style={styles.sub}>{doneMessage}</Text>
        <Button label="Done" onPress={() => { onComplete?.(); reset(); }} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Micro-drama series">
      {mode === 'choose' && (
        <>
          <Text style={styles.sub}>Create a new series or add an episode to an existing one.</Text>
          <Button label="Create new series" onPress={() => setMode('series')} style={{ marginBottom: 8 }} />
          <Button label="Add episode" variant="outline" onPress={() => setMode('episode')} />
        </>
      )}

      {mode === 'series' && (
        <>
          <Label>Series title *</Label>
          <Input value={seriesTitle} onChangeText={setSeriesTitle} placeholder="Series title" />
          <Label>URL slug *</Label>
          <Input
            value={seriesSlug}
            onChangeText={(t) => { setSlugTouched(true); setSeriesSlug(t); }}
            placeholder="my-series"
            autoCapitalize="none"
          />
          <Label>Tagline</Label>
          <Input value={tagline} onChangeText={setTagline} placeholder="Optional tagline" />
          <Label>Description</Label>
          <Input value={description} onChangeText={setDescription} placeholder="Series description" multiline />
          <Label>Genre</Label>
          <View style={styles.chipRow}>
            {GENRES.map((g) => (
              <Pressable key={g} style={[styles.chip, genre === g && styles.chipOn]} onPress={() => setGenre(g)}>
                <Text style={styles.chipText}>{g}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.fileBox} onPress={() => void pickPoster()}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.poster} />
            ) : (
              <Text style={styles.fileLabel}>Cover poster 9:16 (optional)</Text>
            )}
          </Pressable>
          <Button
            label={busy ? 'Creating…' : 'Create series'}
            disabled={!seriesTitle.trim() || !seriesSlug.trim() || busy}
            onPress={() => void submit()}
            style={{ marginTop: 12 }}
          />
          <Button label="Back" variant="ghost" onPress={() => setMode('choose')} />
        </>
      )}

      {mode === 'episode' && (
        <>
          <Label>Episode number *</Label>
          <Input value={episodeNumber} onChangeText={setEpisodeNumber} placeholder="1" keyboardType="number-pad" />
          <Label>Episode title *</Label>
          <Input value={episodeTitle} onChangeText={setEpisodeTitle} placeholder="Episode title" />
          <Label>Cliffhanger hook</Label>
          <Input value={cliffhanger} onChangeText={setCliffhanger} placeholder="Optional hook for next episode" />
          <Pressable style={styles.fileBox} onPress={() => void pickVideo()}>
            <Text style={styles.fileLabel}>{videoFile?.name ?? 'Episode video 9:16 *'}</Text>
          </Pressable>
          {error ? <Text style={{ color: colors.destructive, marginTop: 8 }}>{error}</Text> : null}
          <Button
            label={busy ? 'Uploading…' : 'Publish episode'}
            disabled={!episodeTitle.trim() || !videoFile || busy || !(activeSeriesSlug || initialSeriesSlug)}
            onPress={() => void submit()}
            style={{ marginTop: 12 }}
          />
          <Button label="Back" variant="ghost" onPress={() => setMode('choose')} />
        </>
      )}
    </BottomSheet>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize,
  keyboardType,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
    />
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 20 },
  label: { color: colors.foreground, fontWeight: '600', fontSize: 13, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
    fontSize: 14,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
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
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginTop: 8,
  },
  fileLabel: { color: colors.foreground, fontWeight: '600', fontSize: 13 },
  poster: { width: 90, height: 160, borderRadius: radius.md },
});
