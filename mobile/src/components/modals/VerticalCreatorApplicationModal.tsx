import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void };

export function VerticalCreatorApplicationModal({ visible, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [idUploaded, setIdUploaded] = useState(false);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Apply for vertical series">
      <Text style={styles.sub}>Upload your ID to publish micro-drama series on Prysym TV.</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your series concept (min 20 chars)"
        placeholderTextColor={colors.mutedForeground}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Pressable
        style={[styles.upload, idUploaded && styles.uploadOn]}
        onPress={() => setIdUploaded(true)}
      >
        <Text style={styles.uploadText}>{idUploaded ? '✓ ID attached' : 'Tap to attach government ID'}</Text>
      </Pressable>
      <Button
        label="Submit application"
        disabled={description.trim().length < 20 || !idUploaded}
        onPress={onClose}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 20 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 12,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  upload: {
    marginTop: 12,
    padding: 24,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
  },
  uploadOn: { borderColor: colors.success, backgroundColor: colors.success + '11' },
  uploadText: { color: colors.foreground, fontWeight: '600' },
});
