import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { CastMediaButton } from '@/components/video/CastMediaButton';
import { WatchEngagementRow } from '@/components/engagement/WatchEngagementRow';
import { AdPreroll } from '@/components/ads/AdPreroll';
import { Button } from '@/components/ui/Button';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { getMockVideo } from '@/mocks';
import { colors, withAlpha } from '@/theme/tokens';

export default function MovieScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requireAuth } = useMockAuth();
  const movie = getMockVideo(id ?? '') ?? getMockVideo('movie-1')!;
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inList, setInList] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prerollOpen, setPrerollOpen] = useState(false);
  const [watching, setWatching] = useState(false);

  const startWatch = () => {
    setPrerollOpen(true);
  };

  const finishPreroll = () => {
    setPrerollOpen(false);
    setWatching(true);
  };

  return (
    <>
      <ScrollView style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack title="Movie" showSearch={false} showNotifications={false} />
        </View>
        <PlayerShell
          title={movie.title}
          thumbnailUrl={movie.thumbnailUrl}
          subtitle={`${movie.releaseYear} · ${movie.ageRating}`}
          showCast
        />
        <View style={styles.body}>
          <Text style={styles.meta}>
            {movie.releaseYear} · 120 min · {movie.ageRating} · Action, Drama · 92% match
          </Text>
          <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>
            {movie.tagline ?? 'Mock synopsis. Cast, crew, and metadata load from GET /videos/:id in Phase C.'}
          </Text>
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
          </Pressable>
          <Text style={styles.castTitle}>Cast & crew</Text>
          <Text style={styles.cast}>Director: Jane Prysym</Text>
          <Text style={styles.cast}>Starring: Alex Rivera, Morgan Lee, Kai Santos</Text>
          <Button label="Watch now" onPress={startWatch} />
          <Button
            label={inList ? 'In My List' : '+ My List'}
            variant={inList ? 'secondary' : 'outline'}
            onPress={() => requireAuth(() => setInList(!inList))}
          />
          <WatchEngagementRow
            liked={liked}
            disliked={false}
            saved={saved}
            likesCount={movie.likesCount ?? 0}
            onLike={() => requireAuth(() => setLiked(!liked))}
            onSave={() => requireAuth(() => setSaved(!saved))}
            onPlaylist={() => requireAuth(() => setPlaylistOpen(true))}
            onGift={() => requireAuth(() => setGiftOpen(true))}
            onShare={() => setShareOpen(true)}
          />
          <Button label="Comments" variant="outline" onPress={() => setCommentsOpen(true)} />
          <Pressable style={styles.reportLink} onPress={() => setReportOpen(true)}>
            <Text style={styles.reportText}>Report</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={watching} animationType="fade" statusBarTranslucent onRequestClose={() => setWatching(false)}>
        <View style={[styles.playerScreen, { paddingTop: insets.top }]}>
          <Image source={{ uri: movie.thumbnailUrl ?? '' }} style={styles.playerVideo} contentFit="contain" />
          <View style={styles.playerOverlay}>
            <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
            <Text style={styles.playerMock}>Mock movie player</Text>
          </View>
          <Pressable
            style={[styles.playerClose, { top: insets.top + 12 }]}
            onPress={() => setWatching(false)}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color={colors.onVideo} />
          </Pressable>
          <View style={[styles.playerCast, { top: insets.top + 12 }]}>
            <CastMediaButton variant="on-video" />
          </View>
        </View>
      </Modal>

      <AdPreroll visible={prerollOpen} onComplete={finishPreroll} />
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={movie.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} videoTitle={movie.title} />
      <AddToPlaylistSheet visible={playlistOpen} onClose={() => setPlaylistOpen(false)} contentTitle={movie.title} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  body: { padding: 16, gap: 12 },
  meta: { color: colors.mutedForeground, fontSize: 13 },
  desc: { color: colors.foreground, lineHeight: 20 },
  readMore: { color: colors.primary, fontWeight: '600' },
  castTitle: { color: colors.foreground, fontWeight: '700', marginTop: 8 },
  cast: { color: colors.mutedForeground, fontSize: 13 },
  reportLink: { marginTop: 8 },
  reportText: { color: colors.mutedForeground, fontSize: 13 },
  playerScreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  playerVideo: { width: '100%', aspectRatio: 16 / 9 },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.25),
  },
  playerMock: { color: withAlpha(colors.onVideo, 0.6), fontSize: 12, marginTop: 8 },
  playerClose: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha('#000', 0.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCast: { position: 'absolute', right: 16 },
});
