import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void };

export function EditProfileModal({ visible, onClose }: Props) {
  const { user, updateProfile } = useMockAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? '');

  useEffect(() => {
    if (!visible || !user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setAvatarUri(user.avatarUrl ?? '');
  }, [visible, user]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || user?.displayName,
      bio: bio.trim(),
      avatarUrl: avatarUri || user?.avatarUrl,
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit profile">
      <Pressable style={styles.avatarRow} onPress={pickAvatar}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        <View style={styles.avatarOverlay}>
          <Ionicons name="camera" size={22} color={colors.primaryForeground} />
        </View>
      </Pressable>
      <Text style={styles.avatarHint}>Tap photo to change profile picture</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} multiline />
      <Button label="Save changes" onPress={handleSave} style={{ marginTop: 16 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  avatar: { width: '100%', height: '100%' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { color: colors.mutedForeground, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  label: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
