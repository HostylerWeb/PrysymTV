import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { CreatorUploadSheet } from '@/components/modals/CreatorUploadSheet';
import { createPodcastShow, fetchMyPodcastShows } from '@/lib/api/podcasts';
import { mediaThumb } from '@/lib/api/map-content';
import { colors, radius } from '@/theme/tokens';

export default function SettingsPodcastsScreen() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [showTitle, setShowTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showsQuery = useQuery({
    queryKey: ['podcasts', 'me', 'shows'],
    queryFn: async () => {
      const data = await fetchMyPodcastShows();
      return data.items;
    },
  });

  const createShow = async () => {
    if (!showTitle.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createPodcastShow({ title: showTitle.trim() });
      setShowTitle('');
      setCreateOpen(false);
      await showsQuery.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create show');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Podcasts" showSearch={false} showNotifications={false} />
          <Text style={styles.sub}>Manage your podcast shows, episodes, and RSS feeds.</Text>
          <Button label="New episode" onPress={() => setUploadOpen(true)} style={{ marginBottom: 8 }} />
          <Button label="Create show" variant="outline" onPress={() => setCreateOpen(true)} style={{ marginBottom: 16 }} />
          <FeedQueryState
            isLoading={showsQuery.isLoading}
            isError={showsQuery.isError}
            error={showsQuery.error}
            onRetry={() => void showsQuery.refetch()}
            isEmpty={!showsQuery.isLoading && (showsQuery.data?.length ?? 0) === 0}
            emptyTitle="No shows yet"
          >
            {(showsQuery.data ?? []).map((s) => (
              <Pressable key={s.id} style={styles.row} onPress={() => setUploadOpen(true)}>
                <Image source={{ uri: mediaThumb(s.coverUrl) ?? '' }} style={styles.cover} contentFit="cover" />
                <View style={styles.meta}>
                  <Text style={styles.title}>{s.title}</Text>
                  <Text style={styles.ep}>{s._count.episodes} episodes</Text>
                </View>
              </Pressable>
            ))}
          </FeedQueryState>
        </View>
      </ScrollView>
      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="Create podcast show">
        <TextInput
          style={styles.input}
          placeholder="Show title"
          placeholderTextColor={colors.mutedForeground}
          value={showTitle}
          onChangeText={setShowTitle}
        />
        {error ? <Text style={{ color: colors.destructive, marginTop: 8 }}>{error}</Text> : null}
        <Button
          label={busy ? 'Creating…' : 'Create show'}
          disabled={!showTitle.trim() || busy}
          onPress={() => void createShow()}
          style={{ marginTop: 12 }}
        />
      </BottomSheet>
      <CreatorUploadSheet
        visible={uploadOpen}
        kind="podcast"
        onClose={() => setUploadOpen(false)}
        onSuccess={() => void showsQuery.refetch()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: { width: 56, height: 56, borderRadius: 8 },
  meta: { flex: 1, justifyContent: 'center' },
  title: { color: colors.foreground, fontWeight: '700' },
  ep: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12, color: colors.foreground },
});
