import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { mockPodcastShows } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

export default function SettingsPodcastsScreen() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [showTitle, setShowTitle] = useState('');

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Podcasts" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Manage your podcast shows, episodes, and RSS feeds.</Text>
          <Button label="New episode" onPress={() => router.push('/settings/upload?type=podcast')} style={{ marginBottom: 8 }} />
          <Button label="Create show" variant="outline" onPress={() => setCreateOpen(true)} style={{ marginBottom: 16 }} />
          {mockPodcastShows.map((s) => (
            <Pressable key={s.id} style={styles.row} onPress={() => router.push('/podcast/podcast-ep-1')}>
              <Image source={{ uri: s.coverUrl ?? '' }} style={styles.cover} contentFit="cover" />
              <View style={styles.meta}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.ep}>{s.episodeCount} episodes</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="Create podcast show">
        <TextInput style={styles.input} placeholder="Show title" placeholderTextColor={colors.mutedForeground} value={showTitle} onChangeText={setShowTitle} />
        <Button label="Create (mock)" disabled={!showTitle.trim()} onPress={() => setCreateOpen(false)} style={{ marginTop: 12 }} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  cover: { width: 56, height: 56, borderRadius: 8 },
  meta: { flex: 1, justifyContent: 'center' },
  title: { color: colors.foreground, fontWeight: '700' },
  ep: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground },
});
