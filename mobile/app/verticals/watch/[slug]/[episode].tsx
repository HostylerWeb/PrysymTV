import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VerticalEpisodeAdGate } from '@/components/ads/VerticalEpisodeAdGate';
import { CastMediaButton } from '@/components/video/CastMediaButton';
import { Button } from '@/components/ui/Button';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { GiftModal } from '@/components/modals/GiftModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { useMockAuth } from '@/context/MockAuthContext';
import { getMockVertical } from '@/mocks';
import { colors, radius, withAlpha } from '@/theme/tokens';

const { height } = Dimensions.get('window');

export default function VerticalWatchScreen() {
  const { slug, episode } = useLocalSearchParams<{ slug: string; episode: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAuth } = useMockAuth();
  const series = getMockVertical(slug ?? '') ?? getMockVertical('series-1')!;
  const epNum = parseInt(episode ?? '1', 10) || 1;
  const nextEp = epNum + 1;
  const hasNext = nextEp <= (series.episodeCount ?? 8);

  const [gateOpen, setGateOpen] = useState(true);
  const [gateDismissed, setGateDismissed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seriesSaved, setSeriesSaved] = useState(false);

  const cliffhanger = useMemo(
    () => (epNum % 3 === 0 ? 'Cliffhanger - what happens next?' : null),
    [epNum],
  );

  return (
    <>
      <View style={styles.screen}>
        <Image source={{ uri: series.posterUrl ?? '' }} style={styles.video} contentFit="cover" />
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.push(`/verticals/${series.slug}`)}>
          <Ionicons name="chevron-back" size={28} color={colors.onVideo} />
        </Pressable>
        {!gateDismissed && gateOpen ? (
          <VerticalEpisodeAdGate
            visible={gateOpen}
            onComplete={() => { setGateOpen(false); setGateDismissed(true); }}
          />
        ) : null}
        {gateDismissed ? (
          <>
            <View style={styles.topActions}>
              <CastMediaButton variant="on-video" />
              <Pressable style={styles.headerBtn} onPress={() => requireAuth(() => setLiked(!liked))}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.headerBtn} onPress={() => requireAuth(() => setSaved(!saved))}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.headerBtn} onPress={() => requireAuth(() => setSeriesSaved(!seriesSaved))}>
                <Ionicons name={seriesSaved ? 'albums' : 'albums-outline'} size={22} color={colors.onVideo} />
              </Pressable>
            </View>
            <View style={styles.overlay}>
              <Ionicons name="play" size={56} color={withAlpha(colors.onVideo, 0.7)} />
              <Text style={styles.mock}>Vertical episode player mock</Text>
            </View>
            <View style={[styles.sideActions, { bottom: 160 }]}>
              <Pressable style={styles.action} onPress={() => setCommentsOpen(true)}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.action} onPress={() => requireAuth(() => setGiftOpen(true))}>
                <Ionicons name="gift-outline" size={24} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.action} onPress={() => requireAuth(() => setPlaylistOpen(true))}>
                <Ionicons name="list-outline" size={24} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.action} onPress={() => setShareOpen(true)}>
                <Ionicons name="share-outline" size={24} color={colors.onVideo} />
              </Pressable>
              <Pressable style={styles.action} onPress={() => requireAuth(() => setReportOpen(true))}>
                <Ionicons name="flag-outline" size={24} color={colors.onVideo} />
              </Pressable>
            </View>
          </>
        ) : null}
        <View style={styles.meta}>
          <Text style={styles.title}>{series.title}</Text>
          <Text style={styles.ep}>Episode {epNum}</Text>
          {cliffhanger ? <Text style={styles.cliff}>{cliffhanger}</Text> : null}
          {hasNext ? (
            <Button
              label={`Next: Ep ${nextEp}`}
              variant="secondary"
              size="sm"
              onPress={() => router.replace(`/verticals/watch/${series.slug}/${nextEp}`)}
              style={{ marginTop: 8, alignSelf: 'flex-start' }}
            />
          ) : (
            <Text style={styles.hint}>You reached the latest episode</Text>
          )}
          <Text style={styles.hint}>Swipe up for next episode</Text>
        </View>
      </View>
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={`${series.title} Ep ${epNum}`} />
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={`${series.title} Ep ${epNum}`}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.videoBackground },
  back: { position: 'absolute', left: 12, zIndex: 2, padding: 8 },
  topActions: {
    position: 'absolute',
    top: 56,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: withAlpha(colors.videoBackground, 0.5),
  },
  video: { width: '100%', height: height * 0.75, backgroundColor: colors.secondary },
  gate: {
    position: 'absolute',
    top: '30%',
    left: 24,
    right: 24,
    padding: 20,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.33),
    gap: 8,
  },
  gateLabel: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  gateTitle: { color: colors.foreground, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', height: height * 0.75 },
  mock: { color: withAlpha(colors.onVideo, 0.5), fontSize: 12, marginTop: 8 },
  sideActions: { position: 'absolute', right: 12, gap: 16 },
  action: { padding: 8 },
  meta: { padding: 16 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
  ep: { color: colors.primary, marginTop: 4, fontWeight: '600' },
  cliff: { color: colors.primary, fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  hint: { color: colors.mutedForeground, fontSize: 12, marginTop: 8 },
});
