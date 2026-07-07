import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { mockPlaylists } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

export default function SettingsPlaylistsScreen() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Playlists" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Create and manage playlists for your channel and profile.</Text>
          <Button label="New playlist" onPress={() => setCreateOpen(true)} style={{ marginBottom: 16 }} />
          {mockPlaylists.map((p) => (
            <Pressable key={p.id} style={styles.row} onPress={() => router.push(`/playlist/${p.id}`)}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.meta}>{p.itemCount} items</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="New playlist">
        <TextInput style={styles.input} placeholder="Playlist name" placeholderTextColor={colors.mutedForeground} value={title} onChangeText={setTitle} />
        <Button label="Create (mock)" disabled={!title.trim()} onPress={() => setCreateOpen(false)} style={{ marginTop: 12 }} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: { padding: 14, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.foreground, fontWeight: '700' },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground },
});
