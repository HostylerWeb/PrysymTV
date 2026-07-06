import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { initStreamerIdUpload, uploadPickedFile } from '@/lib/api/profile-upload';
import { getAuthErrorMessage } from '@/context/MockAuthContext';
import { colors, radius } from '@/theme/tokens';
import type { MeResponse } from '@/types/api';

const MIN_DESCRIPTION = 20;

export type StreamerFeatures = Array<'live' | 'vertical'>;

type Props = {
  visible: boolean;
  onClose: () => void;
  user?: MeResponse | null;
  features?: StreamerFeatures;
  initialDescription?: string;
  portfolioUrl?: string;
  bannerMessage?: string;
};

export function StreamerApplicationModal({
  visible,
  onClose,
  user,
  features = ['live'],
  initialDescription = '',
  bannerMessage,
}: Props) {
  const { applyForStreamer, applyForVerticalCreator } = useMockAuth();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState(initialDescription);
  const [idUri, setIdUri] = useState<string | null>(null);
  const [idName, setIdName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const wantsLive = features.includes('live');
  const wantsVertical = features.includes('vertical');
  const descriptionOk = description.trim().length >= MIN_DESCRIPTION;

  useEffect(() => {
    if (visible && initialDescription) setDescription(initialDescription);
  }, [visible, initialDescription]);

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setDescription(initialDescription);
      setIdUri(null);
      setIdName('');
      setError('');
      setIsSubmitting(false);
    }
  }, [visible, initialDescription]);

  const title =
    wantsLive && wantsVertical
      ? 'Verify your identity'
      : wantsVertical
        ? 'Apply for vertical series'
        : 'Become a Streamer';

  const subtitle =
    wantsLive && wantsVertical
      ? 'One ID upload covers live streaming and vertical series access'
      : wantsVertical
        ? 'Upload your ID to publish micro-drama series'
        : 'Apply to start live streaming on Prysym TV';

  const reset = () => {
    setStep(1);
    setDescription(initialDescription);
    setIdUri(null);
    setIdName('');
    setError('');
    onClose();
  };

  const pickId = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is required to upload your ID.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setIdUri(result.assets[0].uri);
      setIdName(result.assets[0].fileName ?? 'id-document.jpg');
    }
  };

  const handleSubmit = async () => {
    if (!descriptionOk || !idUri) return;
    setIsSubmitting(true);
    setError('');
    try {
      const init = await initStreamerIdUpload('image/jpeg', idName || 'id.jpg');
      const publicUrl = await uploadPickedFile(init, {
        uri: idUri,
        mimeType: 'image/jpeg',
        name: idName,
      });
      const desc = description.trim();

      if (
        wantsLive &&
        user?.streamerStatus !== 'approved' &&
        user?.streamerStatus !== 'pending'
      ) {
        await applyForStreamer(desc, publicUrl);
      }
      if (
        wantsVertical &&
        user?.verticalCreatorStatus !== 'approved' &&
        user?.verticalCreatorStatus !== 'pending'
      ) {
        await applyForVerticalCreator(desc, publicUrl);
      }
      if (!user) {
        if (wantsLive) await applyForStreamer(desc, publicUrl);
        if (wantsVertical) await applyForVerticalCreator(desc, publicUrl);
      }
      setStep(3);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (
    visible &&
    wantsLive &&
    !wantsVertical &&
    user?.streamerStatus === 'approved'
  ) {
    return (
      <BottomSheet visible={visible} onClose={reset} title="You're a Streamer!">
        <View style={styles.success}>
          <Ionicons name="radio" size={48} color={colors.success} />
          <Text style={styles.sub}>
            Your application has been approved. You can now start live streaming.
          </Text>
        </View>
        <Button label="Close" onPress={reset} />
      </BottomSheet>
    );
  }

  const anyPending =
    (wantsLive && user?.streamerStatus === 'pending') ||
    (wantsVertical && user?.verticalCreatorStatus === 'pending');

  if (visible && anyPending) {
    return (
      <BottomSheet visible={visible} onClose={reset} title="Application pending">
        <View style={styles.success}>
          <Ionicons name="time" size={48} color={colors.warning} />
          <Text style={styles.sub}>
            Your request is being reviewed. We'll notify you once it's approved.
          </Text>
        </View>
        <Button label="Close" variant="secondary" onPress={reset} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={reset} title={title}>
      <Text style={styles.sub}>{subtitle}</Text>

      <View style={styles.steps}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepWrap}>
            <View style={[styles.stepDot, step >= s && styles.stepDotOn]}>
              {step > s ? (
                <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.stepNum, step >= s && styles.stepNumOn]}>{s}</Text>
              )}
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineOn]} />}
          </View>
        ))}
      </View>

      {bannerMessage ? <Text style={styles.banner}>{bannerMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 1 && (
        <>
          <Text style={styles.label}>Tell us about yourself</Text>
          <TextInput
            style={styles.input}
            placeholder="What kind of content will you create?"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
          />
          <Text style={[styles.counter, !descriptionOk && styles.counterBad]}>
            {description.trim().length}/{MIN_DESCRIPTION} characters minimum
          </Text>
          <Button label="Continue" disabled={!descriptionOk} onPress={() => setStep(2)} style={{ marginTop: 12 }} />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Upload ID verification</Text>
          <Text style={styles.sub}>
            Upload a photo of your government-issued ID. Your document is stored securely and
            reviewed by our team.
          </Text>
          <Pressable
            style={[styles.uploadBox, idUri && styles.uploadBoxOn]}
            onPress={() => void pickId()}
          >
            <Ionicons
              name={idUri ? 'document-text' : 'cloud-upload-outline'}
              size={36}
              color={idUri ? colors.primary : colors.mutedForeground}
            />
            <Text style={styles.uploadText}>{idName || 'Tap to upload'}</Text>
            <Text style={styles.uploadHint}>PNG, JPG up to 10MB</Text>
          </Pressable>
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep(1)} style={styles.flex} />
            <Button
              label={isSubmitting ? 'Submitting…' : 'Submit Application'}
              disabled={!idUri || isSubmitting}
              onPress={() => void handleSubmit()}
              style={styles.flex}
            />
          </View>
          {isSubmitting && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
        </>
      )}

      {step === 3 && (
        <>
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            <Text style={styles.successTitle}>Application submitted</Text>
            <Text style={styles.sub}>
              Status is now pending. Our team will review your ID and application details.
            </Text>
          </View>
          <Button label="Done" onPress={reset} />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 20 },
  label: { color: colors.foreground, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 12,
    color: colors.foreground,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  counterBad: { color: colors.destructive },
  banner: {
    backgroundColor: colors.primary + '18',
    color: colors.foreground,
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: colors.destructive + '18',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stepWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: colors.primary },
  stepNum: { color: colors.mutedForeground, fontWeight: '700', fontSize: 13 },
  stepNumOn: { color: colors.primaryForeground },
  stepLine: { width: 32, height: 4, backgroundColor: colors.secondary, marginHorizontal: 4 },
  stepLineOn: { backgroundColor: colors.primary },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: 6,
    marginBottom: 12,
  },
  uploadBoxOn: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  uploadText: { color: colors.foreground, fontWeight: '600' },
  uploadHint: { color: colors.mutedForeground, fontSize: 11 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  success: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  successTitle: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
});
