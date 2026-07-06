import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/theme/tokens';

const PLATFORMS = ['Website', 'Twitter / X', 'Instagram', 'YouTube', 'TikTok'] as const;

export default function SettingsSocialScreen() {
  const [links, setLinks] = useState<Record<string, string>>({
    Website: 'https://prysym.tv',
    'Twitter / X': 'https://x.com/democreator',
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Social links" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Shown on your public profile - mock PATCH /users/me</Text>
        {PLATFORMS.map((p) => (
          <View key={p} style={styles.field}>
            <Text style={styles.label}>{p}</Text>
            <TextInput
              style={styles.input}
              placeholder={`${p} URL`}
              placeholderTextColor={colors.mutedForeground}
              value={links[p] ?? ''}
              onChangeText={(v) => setLinks((prev) => ({ ...prev, [p]: v }))}
              autoCapitalize="none"
            />
          </View>
        ))}
        <Button label="Save changes" style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { color: colors.foreground, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground },
});
