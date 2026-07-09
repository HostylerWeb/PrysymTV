import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMyPlaylists } from '@/hooks/api/useMyPlaylists';
import { createPlaylist, deletePlaylist } from '@/lib/api/playlists';
import { colors, radius } from '@/theme/tokens';

export default function SettingsPlaylistsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const playlistsQuery = useMyPlaylists();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['playlists', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['profile', 'library'] });
  };

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await createPlaylist({ title: trimmed, type: 'mixed' });
      refresh();
      setTitle('');
      setCreateOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create playlist');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (id: string, playlistTitle: string) => {
    Alert.alert('Delete playlist', `Remove "${playlistTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePlaylist(id);
              refresh();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete playlist');
            }
          })();
        },
      },
    ]);
  };

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title="Playlists" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Create and manage playlists for your channel and profile.</Text>
          <Button label="New playlist" onPress={() => setCreateOpen(true)} style={{ marginBottom: 16 }} />
        </View>

        {playlistsQuery.isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : playlistsQuery.isError ? (
          <FeedQueryState
            isError
            error={playlistsQuery.error}
            onRetry={() => void playlistsQuery.refetch()}
          />
        ) : (playlistsQuery.data?.length ?? 0) === 0 ? (
          <Text style={styles.empty}>No playlists yet.</Text>
        ) : (
          <View style={styles.pad}>
            {playlistsQuery.data!.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => router.push(`/playlist/${p.id}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{p.title}</Text>
                  <Text style={styles.meta}>{p.itemCount} items · {p.type}</Text>
                </View>
                <Pressable onPress={() => handleDelete(p.id, p.title)} hitSlop={8}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="New playlist">
        <TextInput
          style={styles.input}
          placeholder="Playlist name"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={busy ? 'Creating…' : 'Create playlist'}
          disabled={!title.trim() || busy}
          onPress={() => void handleCreate()}
          style={{ marginTop: 12 }}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  empty: { color: colors.mutedForeground, textAlign: 'center', padding: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.foreground, fontWeight: '700' },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  delete: { color: colors.destructive, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground },
  error: { color: colors.destructive, marginTop: 8, fontSize: 13 },
});
