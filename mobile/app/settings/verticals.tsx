import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { VerticalSeriesWizard } from '@/components/modals/VerticalSeriesWizard';
import { VerticalCreatorApplicationModal } from '@/components/modals/VerticalCreatorApplicationModal';
import { mockVerticals } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

export default function SettingsVerticalsScreen() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Micro-dramas" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Manage vertical series - mock GET /verticals/me</Text>
          <Button label="Create new series" onPress={() => setWizardOpen(true)} style={{ marginBottom: 8 }} />
          <Button label="Apply for vertical creator" variant="outline" onPress={() => setApplyOpen(true)} style={{ marginBottom: 16 }} />
          {mockVerticals.slice(0, 4).map((s) => (
            <Pressable key={s.slug} style={styles.row} onPress={() => router.push(`/verticals/${s.slug}`)}>
              <Image source={{ uri: s.posterUrl ?? '' }} style={styles.poster} contentFit="cover" />
              <View style={styles.meta}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.ep}>{s.episodeCount} episodes · {s.genre}</Text>
                <Button label="Manage episodes" variant="ghost" onPress={() => router.push(`/settings/upload?type=vertical`)} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <VerticalSeriesWizard visible={wizardOpen} onClose={() => setWizardOpen(false)} />
      <VerticalCreatorApplicationModal visible={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  poster: { width: 48, height: 64, borderRadius: 6 },
  meta: { flex: 1, justifyContent: 'center' },
  title: { color: colors.foreground, fontWeight: '700' },
  ep: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
});
