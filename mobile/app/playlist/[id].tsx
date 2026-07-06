import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { mockCreatorProfile, mockPlaylists, mockVideos } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const playlist = mockPlaylists.find((p) => p.id === id) ?? mockPlaylists[0];
  const [shareOpen, setShareOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [items, setItems] = useState(mockVideos.slice(0, playlist.itemCount));

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setItems(copy);
  };

  const removeItem = (videoId: string) => {
    Alert.alert('Remove from playlist', 'Remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((prev) => prev.filter((v) => v.id !== videoId)) },
    ]);
  };

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title={playlist.title} showSearch={false} showNotifications={false} />
          <Pressable onPress={() => router.push(`/creator/${mockCreatorProfile.username}`)}>
            <Text style={styles.creatorLink}>View creator profile ›</Text>
          </Pressable>
          {playlist.thumbnailUrl ? (
            <Image source={{ uri: playlist.thumbnailUrl }} style={styles.cover} contentFit="cover" />
          ) : null}
          <Text style={styles.meta}>{items.length} items · Public playlist</Text>
          <Text style={styles.desc}>Curated videos from @{mockCreatorProfile.username}</Text>
          <View style={styles.actions}>
            <Button label={editMode ? 'Done' : 'Edit'} variant="outline" onPress={() => setEditMode(!editMode)} style={styles.flex} />
            <Button label="Share" variant="secondary" onPress={() => setShareOpen(true)} style={styles.flex} />
          </View>
          {editMode && <Button label="Add videos" variant="ghost" onPress={() => router.push('/search')} />}
          {items.map((v, index) => (
            <View key={v.id} style={styles.itemRow}>
              <Pressable style={styles.itemMain} onPress={() => router.push(`/watch/${v.id}`)}>
                <Image source={{ uri: v.thumbnailUrl ?? '' }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={styles.itemMeta}>{v.channel}</Text>
                </View>
              </Pressable>
              {editMode && (
                <View style={styles.editActions}>
                  <Pressable onPress={() => moveItem(index, -1)} disabled={index === 0}>
                    <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.muted : colors.foreground} />
                  </Pressable>
                  <Pressable onPress={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                    <Ionicons name="chevron-down" size={20} color={index === items.length - 1 ? colors.muted : colors.foreground} />
                  </Pressable>
                  <Pressable onPress={() => removeItem(v.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={playlist.title} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  creatorLink: { color: colors.primary, fontWeight: '600', marginBottom: 12 },
  cover: { width: '100%', height: 160, borderRadius: radius.lg, marginBottom: 12, backgroundColor: colors.secondary },
  meta: { color: colors.mutedForeground, marginBottom: 8 },
  desc: { color: colors.foreground, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  flex: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  itemMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 96, height: 54, borderRadius: radius.md, backgroundColor: colors.muted },
  itemTitle: { color: colors.foreground, fontWeight: '600', fontSize: 14 },
  itemMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  editActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
