import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { getAuthErrorMessage } from '@/lib/api/client';
import { fetchMe, replaceSocialLinks } from '@/lib/api/users';
import {
  defaultSocialLinkFields,
  mergeSocialLinks,
  socialLinksPayload,
  SOCIAL_PLATFORMS,
  type SocialPlatformKey,
} from '@/lib/social-platforms';
import { colors, radius } from '@/theme/tokens';

export default function SettingsSocialScreen() {
  const router = useRouter();
  const [links, setLinks] = useState(defaultSocialLinkFields());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        const saved = (me.socialLinks ?? []) as Array<{
          label: string;
          url: string;
          sortOrder: number;
        }>;
        setLinks(mergeSocialLinks(saved));
      } catch {
        if (!cancelled) setLinks(defaultSocialLinkFields());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLink = (key: SocialPlatformKey, url: string) => {
    setLinks((prev) => prev.map((link) => (link.key === key ? { ...link, url } : link)));
  };

  const save = async () => {
    setBusy(true);
    try {
      await replaceSocialLinks(socialLinksPayload(links));
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (err) {
      Alert.alert('Could not save', getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Social links" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Links shown on your public creator profile.</Text>
        {SOCIAL_PLATFORMS.map((platform) => (
          <View key={platform.key} style={styles.field}>
            <Text style={styles.label}>{platform.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={platform.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={links.find((l) => l.key === platform.key)?.url ?? ''}
              onChangeText={(v) => updateLink(platform.key, v)}
              autoCapitalize="none"
              editable={!busy}
            />
          </View>
        ))}
        <Button
          label={busy ? 'Saving…' : 'Save changes'}
          onPress={() => void save()}
          disabled={busy}
          style={{ marginTop: 16 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { color: colors.foreground, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 12,
    color: colors.foreground,
  },
});
