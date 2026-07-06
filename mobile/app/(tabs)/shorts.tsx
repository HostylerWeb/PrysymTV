import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { AdInterstitial } from '@/components/ads/AdInterstitial';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { mockShorts } from '@/mocks';
import { colors, radius, withAlpha } from '@/theme/tokens';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { formatViewCount } from '@/utils/format-media';

const AD_EVERY_N_SWIPES = 5;

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const [feedHeight, setFeedHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [adOpen, setAdOpen] = useState(false);
  const swipeCount = useRef(0);
  const current = mockShorts[index];

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (next == null || next === index) return;
    swipeCount.current += 1;
    if (swipeCount.current > 0 && swipeCount.current % AD_EVERY_N_SWIPES === 0) {
      setAdOpen(true);
    }
    setIndex(next);
  }).current;

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: feedHeight,
      offset: feedHeight * i,
      index: i,
    }),
    [feedHeight],
  );

  return (
    <>
      <View style={styles.screen} onLayout={(e) => setFeedHeight(e.nativeEvent.layout.height)}>
        {feedHeight > 0 && (
          <FlatList
            data={mockShorts}
            keyExtractor={(item) => item.id}
            pagingEnabled
            snapToInterval={feedHeight}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 90 }}
            getItemLayout={getItemLayout}
            renderItem={({ item }) => (
              <View style={{ height: feedHeight, width: '100%', backgroundColor: colors.videoBackground }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => router.push(`/shorts/${item.id}`)}>
                  <Image source={{ uri: item.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                </Pressable>
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                  locations={[0, 0.45, 1]}
                  style={styles.videoScrim}
                  pointerEvents="none"
                />

                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                  <Text style={styles.topTitle}>Shorts</Text>
                  <View style={styles.topActions}>
                    <Pressable onPress={() => setMuted(!muted)} hitSlop={8}>
                      <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color={colors.onVideo} />
                    </Pressable>
                    <Pressable hitSlop={8}>
                      <Ionicons name="ellipsis-vertical" size={22} color={colors.onVideo} />
                    </Pressable>
                    <Pressable onPress={() => requireAuth(() => trigger('short'))} hitSlop={8}>
                      <Ionicons name="add" size={24} color={colors.onVideo} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/search?scope=short')} hitSlop={8}>
                      <Ionicons name="search" size={22} color={colors.onVideo} />
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.sideActions, { bottom: tabInset + 12 }]}>
                  <Action
                    icon={liked[item.id] ? 'heart' : 'heart-outline'}
                    label={formatViewCount(item.likesCount ?? 0)}
                    onPress={() => requireAuth(() => setLiked((p) => ({ ...p, [item.id]: !p[item.id] })))}
                  />
                  <Action icon="chatbubble-outline" label="128" onPress={() => setCommentsOpen(true)} />
                  <Action icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
                  <Action icon="bookmark-outline" label="Save" onPress={() => requireAuth(() => setPlaylistOpen(true))} />
                  <Action icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
                  <Action icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
                </View>

                <View style={[styles.bottomMeta, { paddingBottom: tabInset + 8 }]}>
                  <Pressable onPress={() => router.push(`/creator/${item.channelSlug}`)}>
                    <Text style={styles.channel}>@{item.channelSlug}</Text>
                  </Pressable>
                  <Text style={styles.caption} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.music}>Original Sound - {item.channelSlug}</Text>
                  <Pressable
                    style={[styles.followBtn, following[item.channelSlug ?? ''] && styles.followingBtn]}
                    onPress={() => requireAuth(() => setFollowing((p) => ({ ...p, [item.channelSlug ?? '']: !p[item.channelSlug ?? ''] })))}
                  >
                    <Text style={styles.followText}>
                      {following[item.channelSlug ?? ''] ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
      <AdInterstitial visible={adOpen} onClose={() => setAdOpen(false)} />
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} videoTitle={current?.title} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={current?.title ?? 'Short'} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <AddToPlaylistSheet visible={playlistOpen} onClose={() => setPlaylistOpen(false)} contentTitle={current?.title} />
      {flowHost}
    </>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={styles.actionBtn}>
        <Ionicons name={icon} size={24} color={colors.onVideo} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.videoBackground },
  videoScrim: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  topTitle: { color: colors.onVideo, fontSize: 18, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sideActions: { position: 'absolute', right: 12, alignItems: 'center', gap: 16, zIndex: 2 },
  action: { alignItems: 'center', gap: 4 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.onVideoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: colors.onVideo, fontSize: 11, fontWeight: '600' },
  bottomMeta: { position: 'absolute', left: 0, right: 72, bottom: 0, paddingHorizontal: 16, zIndex: 2 },
  channel: { color: colors.onVideo, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  caption: { color: colors.onVideoSoft, fontSize: 14, marginBottom: 4 },
  music: { color: colors.onVideoCaption, fontSize: 12, marginBottom: 8 },
  followBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  followingBtn: { backgroundColor: withAlpha(colors.onVideo, 0.2) },
  followText: { color: colors.onVideo, fontWeight: '700', fontSize: 12 },
});
