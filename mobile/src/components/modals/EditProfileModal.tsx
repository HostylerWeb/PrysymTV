import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { useMockAuth, getAuthErrorMessage } from '@/context/MockAuthContext';
import { resolveProfileMediaUrl, resolveAvatarUrl, withUploadVersion } from '@/lib/media-url';
import { GenderField } from '@/components/auth/GenderField';
import type { UserGenderValue } from '@/lib/user-gender';
import { updateMe } from '@/lib/api/users';
import {
  initAvatarUpload,
  initBannerUpload,
  uploadPickedFile,
} from '@/lib/api/profile-upload';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void };

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export function EditProfileModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { user, refreshUser } = useMockAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [gender, setGender] = useState<UserGenderValue | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? '');
  const [bannerUri, setBannerUri] = useState(user?.bannerUrl ?? '');
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setGender((user.gender as UserGenderValue | null) ?? '');
    setBirthDate(user.birthDate ?? '');
    setAvatarUri(resolveProfileMediaUrl(user.avatarUrl) ?? '');
    setBannerUri(resolveProfileMediaUrl(user.bannerUrl) ?? '');
    setPendingAvatarUrl(null);
    setPendingBannerUrl(null);
    setError('');
  }, [visible, user]);

  const uploadImage = async (asset: PickedAsset, kind: 'avatar' | 'banner') => {
    const mimeType = asset.mimeType || 'image/jpeg';
    const fileName = asset.fileName || (kind === 'avatar' ? 'avatar.jpg' : 'banner.jpg');

    if (kind === 'avatar') {
      setAvatarUri(asset.uri);
      setUploadingAvatar(true);
    } else {
      setBannerUri(asset.uri);
      setUploadingBanner(true);
    }
    setError('');

    try {
      const init =
        kind === 'avatar'
          ? await initAvatarUpload(mimeType, fileName)
          : await initBannerUpload(mimeType, fileName);
      const publicUrl = await uploadPickedFile(init, {
        uri: asset.uri,
        mimeType,
        name: fileName,
      });
      const versioned = withUploadVersion(publicUrl);
      if (kind === 'avatar') {
        setPendingAvatarUrl(versioned);
        setAvatarUri(resolveProfileMediaUrl(versioned) ?? asset.uri);
      } else {
        setPendingBannerUrl(versioned);
        setBannerUri(resolveProfileMediaUrl(versioned) ?? asset.uri);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
      if (kind === 'avatar') setAvatarUri(resolveProfileMediaUrl(user?.avatarUrl) ?? '');
      else setBannerUri(resolveProfileMediaUrl(user?.bannerUrl) ?? '');
    } finally {
      if (kind === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const pickImage = async (kind: 'avatar' | 'banner') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'avatar' ? [1, 1] : [3, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await uploadImage(result.assets[0], kind);
    }
  };

  const handleSave = async () => {
    const name = displayName.trim();
    if (!name) {
      setError('Display name is required.');
      return;
    }

    const birth = birthDate.trim();
    if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      setError('Birth date must be YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateMe({
        displayName: name,
        bio: bio.trim() || undefined,
        gender: gender || undefined,
        birthDate: birth || undefined,
        ...(pendingAvatarUrl ? { avatarUrl: pendingAvatarUrl } : {}),
        ...(pendingBannerUrl ? { bannerUrl: pendingBannerUrl } : {}),
      });
      await refreshUser();
      onClose();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploadingAvatar || uploadingBanner;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit profile">
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <Pressable
        style={[styles.bannerRow, { backgroundColor: colors.secondary }]}
        onPress={() => void pickImage('banner')}
        disabled={busy}
      >
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={styles.banner} contentFit="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.bannerOverlay}>
          {uploadingBanner ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons name="camera" size={22} color={colors.primaryForeground} />
          )}
        </View>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tap banner to change</Text>

      <Pressable
        style={[styles.avatarRow, { backgroundColor: colors.secondary }]}
        onPress={() => void pickImage('avatar')}
        disabled={busy}
      >
        <Image
          source={{
            uri: resolveAvatarUrl(
              pendingAvatarUrl ?? user?.avatarUrl,
              user?.username ?? user?.displayName ?? 'user',
            ),
          }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.avatarOverlay}>
          {uploadingAvatar ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons name="camera" size={22} color={colors.primaryForeground} />
          )}
        </View>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tap photo to change avatar</Text>

      <ThemedInput label="Display name" value={displayName} onChangeText={setDisplayName} />
      <ThemedInput label="Bio" value={bio} onChangeText={setBio} multiline />
      <GenderField value={gender} onChange={setGender} />
      <ThemedInput
        label="Birth date"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />
      <Button
        label={saving ? 'Saving…' : 'Save changes'}
        onPress={() => void handleSave()}
        disabled={busy}
        style={{ marginTop: 16 }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  bannerRow: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 3,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    alignSelf: 'center',
    marginTop: 12,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
