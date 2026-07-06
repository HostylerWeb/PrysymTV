import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { AdPreroll } from '@/components/ads/AdPreroll';
import { MOCK_PODCAST_AD } from '@/components/ads/mock-ad-data';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockCreatorProfile, mockPodcastEpisodes } from '@/mocks';
import { colors, radius } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

export default function PodcastEpisodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const ep = mockPodcastEpisodes.find((e) => e.id === id) ?? mockPodcastEpisodes[0];
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [started, setStarted] = useState(false);

  const startPlayback = () => {
    if (!started) {
      setPrerollOpen(true);
      return;
    }
  };

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
          <Pressable onPress={() => router.push('/(tabs)/podcasts')}>
            <Text style={styles.backLink}>‹ Back to Podcasts</Text>
          </Pressable>
        </View>
        {ep.mediaType === 'video' ? (
          <PlayerShell title={ep.title} thumbnailUrl={ep.coverUrl} subtitle={ep.showTitle} showCast />
        ) : (
          <View style={styles.audio}>
            <Text style={styles.audioTitle}>{ep.title}</Text>
            <Text style={styles.audioSub}>
              {ep.showTitle} · {formatDuration(ep.durationSeconds)} · 12K plays · 2 days ago
            </Text>
            <View style={styles.controls}>
              <Pressable style={styles.ctrlBtn}><Text style={styles.ctrlText}>15s</Text></Pressable>
              <Pressable style={styles.playBtn} onPress={startPlayback}>
                <Text style={styles.playText}>{started ? 'Playing' : 'Play'}</Text>
              </Pressable>
              <Pressable style={styles.ctrlBtn}><Text style={styles.ctrlText}>15s</Text></Pressable>
            </View>
            <Text style={styles.hint}>{started ? 'Mock audio player running' : 'Tap play to start (short ad first)'}</Text>
          </View>
        )}
        <Text style={styles.epDesc}>Listen to {ep.title} on Prysym Podcasts.</Text>
        <Pressable style={styles.hostCard} onPress={() => router.push(`/creator/${mockCreatorProfile.username}`)}>
          <Image source={{ uri: mockCreatorProfile.avatarUrl ?? '' }} style={styles.hostAvatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.hostLabel}>Hosted by</Text>
            <Text style={styles.hostName}>{mockCreatorProfile.displayName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.iconRow}>
          <IconBtn icon={liked ? 'heart' : 'heart-outline'} label="Like" active={liked} onPress={() => requireAuth(() => setLiked(!liked))} />
          <IconBtn icon={saved ? 'bookmark' : 'bookmark-outline'} label="Save" active={saved} onPress={() => requireAuth(() => setSaved(!saved))} />
          <IconBtn icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
          <IconBtn icon="list-outline" label="Playlist" onPress={() => requireAuth(() => setPlaylistOpen(true))} />
          <IconBtn icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
          <IconBtn icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
        </View>
        <Button label="Comments" variant="outline" onPress={() => setCommentsOpen(true)} style={styles.bodyBtn} />
      </ScrollView>
      <AdPreroll
        visible={prerollOpen}
        ad={MOCK_PODCAST_AD}
        onComplete={() => { setPrerollOpen(false); setStarted(true); }}
      />
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={ep.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <AddToPlaylistSheet visible={playlistOpen} onClose={() => setPlaylistOpen(false)} contentTitle={ep.title} />
    </>
  );
}

function IconBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.iconBtn, active && styles.iconBtnActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.foreground} />
      <Text style={[styles.iconLabel, active && styles.iconLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  backLink: { color: colors.primary, fontWeight: '600', marginBottom: 8 },
  epDesc: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, paddingHorizontal: 16, marginBottom: 12 },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted },
  hostLabel: { color: colors.mutedForeground, fontSize: 11 },
  hostName: { color: colors.foreground, fontWeight: '700' },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  iconBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    minWidth: 64,
  },
  iconBtnActive: { backgroundColor: colors.primary + '22' },
  iconLabel: { color: colors.foreground, fontSize: 10, fontWeight: '600' },
  iconLabelActive: { color: colors.primary },
  bodyBtn: { marginHorizontal: 16, marginBottom: 16 },
  audio: { padding: 24, alignItems: 'center', gap: 12 },
  audioTitle: { color: colors.foreground, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  audioSub: { color: colors.mutedForeground, fontSize: 14 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  ctrlBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  ctrlText: { color: colors.foreground, fontWeight: '600', fontSize: 12 },
  playBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  playText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 15 },
  hint: { color: colors.mutedForeground, fontSize: 12, marginTop: 16 },
});
