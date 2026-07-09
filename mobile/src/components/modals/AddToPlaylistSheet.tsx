import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { addPlaylistItem, createPlaylist, fetchMyPlaylists } from '@/lib/api/playlists';
import type { ApiPlaylistSummary } from '@/lib/api/playlists';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  contentTitle?: string;
  itemType?: 'video' | 'podcast_episode';
  itemId?: string;
};

export function AddToPlaylistSheet({
  visible,
  onClose,
  contentTitle,
  itemType = 'video',
  itemId,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { isAuthenticated, requireAuth } = useMockAuth();
  const [playlists, setPlaylists] = useState<ApiPlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!visible || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    void fetchMyPlaylists()
      .then((res) => setPlaylists(res.items))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [visible, isAuthenticated]);

  const compatible = (p: ApiPlaylistSummary) => {
    if (p.type === 'mixed') return true;
    if (p.type === 'video') return itemType === 'video';
    return itemType === 'podcast_episode';
  };

  const handleAdd = async (playlistId: string) => {
    if (!itemId) {
      setError('Missing content to save.');
      return;
    }
    setBusyId(playlistId);
    setError(null);
    try {
      await addPlaylistItem(playlistId, { itemType, itemId });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add to playlist');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title || !itemId) return;
    setCreating(true);
    setError(null);
    try {
      const type = itemType === 'podcast_episode' ? 'podcast' : 'mixed';
      const created = await createPlaylist({ title, type });
      await addPlaylistItem(created.id, { itemType, itemId });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create playlist');
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Save to playlist">
      {contentTitle ? <Text style={styles.sub}>Add "{contentTitle}" to a playlist</Text> : null}
      {!isAuthenticated ? (
        <View style={styles.guestWrap}>
          <Text style={styles.guestText}>Sign in to manage playlists and save videos.</Text>
          <Button label="Sign in" onPress={() => requireAuth(() => onClose())} />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.createRow}>
            <TextInput
              style={styles.input}
              placeholder="New playlist name"
              placeholderTextColor={styles.inputPlaceholder.color}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Button
              label={creating ? '…' : 'Create'}
              disabled={creating || !newTitle.trim() || !itemId}
              onPress={() => void handleCreate()}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} />
          ) : playlists.filter(compatible).length === 0 ? (
            <Text style={styles.guestText}>No compatible playlists yet. Create one above.</Text>
          ) : (
            playlists.filter(compatible).map((p) => (
              <Pressable
                key={p.id}
                style={styles.row}
                onPress={() => void handleAdd(p.id)}
                disabled={busyId === p.id}
              >
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.meta}>{p.itemCount} items</Text>
              </Pressable>
            ))
          )}
        </>
      )}
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12 },
    guestWrap: { alignItems: 'center', gap: 12, paddingVertical: 24 },
    guestText: { color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
    error: { color: colors.destructive, marginBottom: 8, fontSize: 13 },
    createRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
    input: {
      flex: 1,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      color: colors.foreground,
    },
    inputPlaceholder: { color: colors.mutedForeground },
    row: {
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    title: { color: colors.foreground, fontWeight: '600' },
    meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  });
}
