import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { ShareModal } from '@/components/modals/ShareModal';
import { usePlaylistDetail } from '@/hooks/api/usePlaylistDetail';
import { colors, radius } from '@/theme/tokens';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const playlistQuery = usePlaylistDetail(id);
  const playlist = playlistQuery.data;
  const [shareOpen, setShareOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  if (playlistQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (playlistQuery.isError || !playlist) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={playlistQuery.error} onRetry={() => void playlistQuery.refetch()} />
      </View>
    );
  }

  const openItem = (href: string) => {
    router.push(href as never);
  };

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title={playlist.title} showSearch={false} showNotifications={false} />
          <Pressable onPress={() => router.push(`/creator/${playlist.creatorSlug}`)}>
            <Text style={styles.creatorLink}>by {playlist.creatorName} ›</Text>
          </Pressable>
          {playlist.coverUrl ? (
            <Image source={{ uri: playlist.coverUrl }} style={styles.cover} contentFit="cover" />
          ) : null}
          <Text style={styles.meta}>{playlist.itemCount} items · {playlist.visibility ?? 'public'} playlist</Text>
          {playlist.description ? (
            <Text style={styles.desc}>{playlist.description}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button label={editMode ? 'Done' : 'Edit'} variant="outline" onPress={() => setEditMode(!editMode)} style={styles.flex} />
            <Button label="Share" variant="secondary" onPress={() => setShareOpen(true)} style={styles.flex} />
          </View>
          {editMode && (
            <Button label="Add videos" variant="ghost" onPress={() => router.push('/search')} />
          )}
          {playlist.items.length === 0 ? (
            <FeedQueryState isEmpty emptyTitle="Empty playlist" emptyMessage="No items in this playlist yet." />
          ) : (
            playlist.items.map((item) => (
              <View key={item.playlistItemId ?? item.id} style={styles.itemRow}>
                <Pressable style={styles.itemMain} onPress={() => openItem(item.href)}>
                  <Image source={{ uri: item.coverUrl ?? '' }} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{item.subtitle}</Text>
                  </View>
                </Pressable>
                {editMode && (
                  <Pressable
                    onPress={() => Alert.alert('Remove', 'Playlist editing will be available in a later update.')}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={playlist.title} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
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
});
