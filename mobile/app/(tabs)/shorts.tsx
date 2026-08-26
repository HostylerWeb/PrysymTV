import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { AdInterstitial } from '@/components/ads/AdInterstitial';
import { fetchServedAd, isValidServedAd, type ServedAd } from '@/lib/api/ads';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { LinearGradient } from 'expo-linear-gradient';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { flattenShortsPages, useShortsFeed } from '@/hooks/api/useShortsFeed';
import { followUser, unfollowUser } from '@/lib/api/users';
import { toggleVideoLike, toggleVideoSave } from '@/lib/api/videos';
import { colors, radius, withAlpha } from '@/theme/tokens';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useWatchAnalytics } from '@/hooks/useWatchAnalytics';
import { bumpLikeCount } from '@/utils/engagement-count';
import { formatViewCount } from '@/utils/format-media';
import { withContentServiceGate } from '@/components/layout/ContentServiceGate';

const SHORT_PLAYER_WINDOW = 1;

function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const router = useRouter();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  const [feedHeight, setFeedHeight] = useState(0);

  const shortsQuery = useShortsFeed();
  const shorts = useMemo(() => flattenShortsPages(shortsQuery.data?.pages), [shortsQuery.data?.pages]);

  const startIndex = start ? Math.max(0, shorts.findIndex((s) => s.id === start)) : 0;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [giftOpen, setGiftOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [adOpen, setAdOpen] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<ServedAd | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const swipeCount = useRef(0);
  const current = shorts[index];

  useWatchAnalytics(isFocused ? current?.id : undefined, {
    creatorId: current?.creatorId,
  });

  useEffect(() => {
    if (!current) return;
    setLiked((p) => ({ ...p, [current.id]: !!current.liked }));
    setLikeCounts((p) => ({ ...p, [current.id]: current.likesCount ?? 0 }));
    setSaved((p) => ({ ...p, [current.id]: !!current.saved }));
    setFollowing((p) => ({
      ...p,
      [current.channelSlug ?? '']: !!current.isFollowing,
    }));
  }, [current?.id, current?.liked, current?.saved, current?.isFollowing, current?.channelSlug]);

  useEffect(() => {
    if (!shorts.length) return;
    const i = start ? Math.max(0, shorts.findIndex((s) => s.id === start)) : 0;
    setIndex(i >= 0 ? i : 0);
  }, [start, shorts.length]);

  useEffect(() => {
    if (!start || feedHeight <= 0 || shorts.length === 0) return;
    const i = shorts.findIndex((s) => s.id === start);
    if (i < 0) return;
    setIndex(i);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: i, animated: false });
    });
  }, [start, feedHeight, shorts]);

  const { shortsInterstitialEveryNSwipes, shortsInterstitialEnabled, isPlacementEnabled } =
    usePublicAdsConfig();
  const adEveryRef = useRef(shortsInterstitialEveryNSwipes);
  const adsEnabledRef = useRef(shortsInterstitialEnabled && isPlacementEnabled('shorts_interstitial'));
  adEveryRef.current = shortsInterstitialEveryNSwipes;
  adsEnabledRef.current = shortsInterstitialEnabled && isPlacementEnabled('shorts_interstitial');

  const indexRef = useRef(0);
  const shortsLenRef = useRef(0);
  indexRef.current = index;
  shortsLenRef.current = shorts.length;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (next == null || next === indexRef.current) return;
    swipeCount.current += 1;
    if (
      adsEnabledRef.current &&
      swipeCount.current > 0 &&
      swipeCount.current % adEveryRef.current === 0
    ) {
      void fetchServedAd('shorts_interstitial', { peek: true }).then((peekAd) => {
        if (!isValidServedAd(peekAd)) return;
        setInterstitialAd(peekAd);
        setAdOpen(true);
      });
    }
    setIndex(next);
    if (next >= shortsLenRef.current - 3 && shortsQuery.hasNextPage && !shortsQuery.isFetchingNextPage) {
      void shortsQuery.fetchNextPage();
    }
  }).current;

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: feedHeight,
      offset: feedHeight * i,
      index: i,
    }),
    [feedHeight],
  );

  const isLoading = shortsQuery.isLoading && shorts.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await shortsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [shortsQuery]);

  return (
    <>
      <View style={styles.screen} onLayout={(e) => setFeedHeight(e.nativeEvent.layout.height)}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : shortsQuery.isError ? (
          <FeedQueryState
            isError
            error={shortsQuery.error}
            onRetry={() => void shortsQuery.refetch()}
          />
        ) : shorts.length === 0 ? (
          <FeedQueryState
            isEmpty
            emptyTitle="No shorts yet"
            emptyMessage="Check back soon for new short-form videos."
            onRetry={() => void shortsQuery.refetch()}
          />
        ) : feedHeight > 0 ? (
          <FlatList
            ref={listRef}
            data={shorts}
            keyExtractor={(item) => item.id}
            initialScrollIndex={startIndex > 0 ? startIndex : undefined}
            onScrollToIndexFailed={() => {}}
            pagingEnabled
            snapToInterval={feedHeight}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={2}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 90 }}
            getItemLayout={getItemLayout}
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />
            }
            renderItem={({ item, index: itemIndex }) => {
              const isActive = itemIndex === index;
              const inPlayerWindow = Math.abs(itemIndex - index) <= SHORT_PLAYER_WINDOW;
              const slug = item.channelSlug ?? '';
              const isFollowing = !!following[slug];
              const isLiked = !!liked[item.id];
              const isSaved = !!saved[item.id];
              return (
              <View style={{ height: feedHeight, width: '100%', backgroundColor: colors.videoBackground }}>
                <Image source={{ uri: item.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {inPlayerWindow && isFocused && item.playbackUrl ? (
                  <HlsPlayer
                    key={`short-player-${item.id}`}
                    source={item.playbackUrl}
                    posterUrl={item.thumbnailUrl}
                    fill
                    muted={muted}
                    contentFit="cover"
                    loop
                    nativeControls={false}
                    seekOnTap
                    enableFullscreen
                    tapToToggle={false}
                    autoPlay={isActive}
                    paused={!isFocused || !isActive}
                    onMutedChange={setMuted}
                  />
                ) : null}
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                  locations={[0, 0.45, 1]}
                  style={styles.videoScrim}
                  pointerEvents="none"
                />

                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                  <Text style={styles.topTitle}>Shorts</Text>
                  <View style={styles.topActions}>
                    <Pressable onPress={() => requireAuth(() => trigger('short'))} hitSlop={8}>
                      <Ionicons name="add" size={24} color={colors.onVideo} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/search?scope=short')} hitSlop={8}>
                      <Ionicons name="search" size={22} color={colors.onVideo} />
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.sideActions, { bottom: tabInset + 12 }]} pointerEvents="box-none">
                  <Action
                    icon={isLiked ? 'heart' : 'heart-outline'}
                    label={formatViewCount(likeCounts[item.id] ?? item.likesCount ?? 0)}
                    onPress={() => requireAuth(async () => {
                      const wasLiked = isLiked;
                      try {
                        const res = await toggleVideoLike(item.id);
                        setLiked((p) => ({ ...p, [item.id]: res.liked }));
                        setLikeCounts((p) => ({
                          ...p,
                          [item.id]:
                            res.likesCount != null
                              ? res.likesCount
                              : bumpLikeCount(p[item.id] ?? item.likesCount ?? 0, wasLiked, res.liked),
                        }));
                      } catch {
                        setLiked((p) => ({ ...p, [item.id]: wasLiked }));
                      }
                    })}
                  />
                  <Action
                    icon="chatbubble-outline"
                    label={formatViewCount(item.commentsCount ?? 0)}
                    onPress={() => setCommentsOpen(true)}
                  />
                  <Action icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
                  <Action
                    icon={isSaved ? 'bookmark' : 'bookmark-outline'}
                    label={isSaved ? 'Saved' : 'Save'}
                    onPress={() => requireAuth(async () => {
                      const prev = isSaved;
                      try {
                        const res = await toggleVideoSave(item.id);
                        setSaved((p) => ({ ...p, [item.id]: res.saved }));
                      } catch {
                        setSaved((p) => ({ ...p, [item.id]: prev }));
                      }
                    })}
                  />
                  <Action icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
                  <Action icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
                </View>

                <View style={[styles.bottomMeta, { paddingBottom: tabInset + 8 }]} pointerEvents="box-none">
                  <Pressable onPress={() => router.push(`/creator/${item.channelSlug}`)}>
                    <Text style={styles.channel}>@{item.channelSlug}</Text>
                  </Pressable>
                  <Text style={styles.caption} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.music}>Original Sound - {item.channelSlug}</Text>
                  <Pressable
                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                    onPress={() => requireAuth(async () => {
                      const next = !isFollowing;
                      const prev = isFollowing;
                      try {
                        if (next) await followUser(slug);
                        else await unfollowUser(slug);
                        setFollowing((p) => ({ ...p, [slug]: next }));
                      } catch {
                        setFollowing((p) => ({ ...p, [slug]: prev }));
                      }
                    })}
                  >
                    <Text style={styles.followText}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
            }}
          />
        ) : null}
      </View>
      <AdInterstitial
        visible={adOpen}
        servedAd={interstitialAd}
        onClose={() => {
          setAdOpen(false);
          setInterstitialAd(null);
        }}
        videoId={current?.id}
        creatorId={current?.creatorId}
      />
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} videoId={current?.id} videoTitle={current?.title} />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={current?.title ?? 'Short'}
        url={current?.id ? buildShareUrl(`/shorts/${current.id}`) : undefined}
        targetId={current?.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetId={current?.id} />
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={current?.creatorId}
        receiverName={current?.channel}
        videoId={current?.id}
      />
      <AddToPlaylistSheet
        visible={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        contentTitle={current?.title}
        itemType="video"
        itemId={current?.id}
      />
      {flowHost}
    </>
  );
}

export default withContentServiceGate('shorts', ShortsScreen);

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
