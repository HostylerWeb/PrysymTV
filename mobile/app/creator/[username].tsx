import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { StoreCartLink } from '@/components/store/StoreCartLink';
import { useMockAuth } from '@/context/MockAuthContext';
import {
  useCreatorPlaylists,
  useCreatorProfile,
  useCreatorStore,
  useCreatorVideos,
} from '@/hooks/api';
import { createChannelSubscription } from '@/lib/api/billing';
import { fetchPodcastShows } from '@/lib/api/podcasts';
import { mapPodcastShow } from '@/lib/api/map-content';
import { fetchPublicConfig } from '@/lib/api/public-config';
import {
  followUser,
  toggleLiveAlerts,
  unfollowUser,
} from '@/lib/api/users';
import { completeMobileCheckout } from '@/lib/stripe-checkout';
import { normalizeUsernameSlug } from '@/lib/username-slug';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

const TABS = ['Videos', 'Shorts', 'Live', 'Playlists', 'Podcasts', 'Store', 'About'] as const;
type TabName = (typeof TABS)[number];

export default function CreatorScreen() {
  const { username: rawUsername } = useLocalSearchParams<{ username: string }>();
  const slug = normalizeUsernameSlug(rawUsername ?? '');
  const router = useRouter();
  const { colors } = useTheme();
  const { requireAuth } = useMockAuth();

  const profileQuery = useCreatorProfile(slug);
  const profile = profileQuery.data;
  const videosQuery = useCreatorVideos(slug);
  const playlistsQuery = useCreatorPlaylists(slug);
  const storeQuery = useCreatorStore(slug, Boolean(profile?.hasStore));

  const configQuery = useQuery({
    queryKey: ['config', 'public', 'membership'],
    queryFn: fetchPublicConfig,
  });

  const podcastsQuery = useQuery({
    queryKey: ['creator', 'podcasts', slug],
    enabled: Boolean(slug && profile),
    queryFn: async () => {
      const shows = await fetchPodcastShows(1, 50);
      return shows.items
        .filter((s) => s.creator?.username === profile?.username)
        .map(mapPodcastShow);
    },
  });

  const [tab, setTab] = useState<TabName>('Videos');
  const [following, setFollowing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFollowing(profile.isFollowing ?? false);
    setLiveAlerts(profile.liveAlertsOn ?? false);
    setIsMember(profile.isChannelMember ?? false);
  }, [profile]);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => t !== 'Store' || profile?.hasStore),
    [profile?.hasStore],
  );

  const videos = videosQuery.data?.videos ?? [];
  const longVideos = videos.filter((v) => v.type !== 'short');
  const shorts = videos.filter((v) => v.type === 'short');

  const membershipBasic = configQuery.data?.channelMembership?.basic.priceUsd ?? 4.99;
  const membershipVip = configQuery.data?.channelMembership?.premium.priceUsd ?? 9.99;

  const handleFollow = () => {
    if (!profile) return;
    requireAuth(async () => {
      const next = !following;
      try {
        if (next) await followUser(profile.username);
        else await unfollowUser(profile.username);
        setFollowing(next);
      } catch {
        setFollowing(next);
      }
    });
  };

  const handleLiveAlerts = () => {
    if (!profile) return;
    requireAuth(async () => {
      try {
        const res = await toggleLiveAlerts(profile.username);
        setLiveAlerts(res.enabled);
      } catch {
        setLiveAlerts((prev) => !prev);
      }
    });
  };

  const handleMembership = (tier: 'basic' | 'premium') => {
    if (!profile) return;
    requireAuth(async () => {
      setMembershipBusy(true);
      setMembershipError(null);
      try {
        const res = await createChannelSubscription({ creatorId: profile.id, tier });
        const checkout = await completeMobileCheckout(res);
        if (checkout.ok) {
          setIsMember(true);
        } else {
          throw new Error(checkout.error ?? 'Could not start membership checkout');
        }
      } catch (err) {
        setMembershipError(err instanceof Error ? err.message : 'Could not start membership checkout');
      } finally {
        setMembershipBusy(false);
      }
    });
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
        </View>
        <FeedQueryState
          isError
          error={profileQuery.error ?? new Error('Creator not found')}
          onRetry={() => void profileQuery.refetch()}
        />
        <View style={styles.pad}>
          <Button label="Back to home" variant="outline" onPress={() => router.push('/')} />
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        {profile.bannerDisplayUrl ? (
          <Image source={{ uri: profile.bannerDisplayUrl }} style={styles.banner} contentFit="cover" />
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.muted }]} />
        )}
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
          <View style={styles.row}>
            <Image
              source={{ uri: profile.avatarDisplayUrl }}
              style={[styles.avatar, { borderColor: colors.background }]}
              contentFit="cover"
            />
            {profile.isVerified && (
              <View style={styles.verified}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              </View>
            )}
            <View style={styles.stats}>
              <MiniStat n={profile.followersCount} l="Followers" colors={colors} />
              <MiniStat n={profile.videosCount} l="Videos" colors={colors} />
            </View>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile.displayName ?? profile.username}
          </Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{profile.bio}</Text>
          ) : null}

          {profile.socialLinks.length > 0 && (
            <View style={styles.socialRow}>
              {profile.socialLinks.map((link) => (
                <Pressable key={`${link.label}-${link.url}`} onPress={() => void Linking.openURL(link.url)}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {profile.isLive && profile.liveStreamId && (
            <Button
              label="● Watch live"
              onPress={() => router.push(`/live/${profile.liveStreamId}`)}
              style={{ marginBottom: 10 }}
            />
          )}

          <View style={styles.btns}>
            <Button
              label={following ? 'Following' : 'Follow'}
              variant={following ? 'secondary' : 'primary'}
              style={styles.flex}
              onPress={handleFollow}
            />
            <Button
              label="Tip"
              variant="outline"
              style={styles.flex}
              onPress={() => requireAuth(() => setGiftOpen(true))}
            />
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
              onPress={handleLiveAlerts}
            >
              <Ionicons
                name={liveAlerts ? 'notifications' : 'notifications-outline'}
                size={22}
                color={liveAlerts ? colors.primary : colors.foreground}
              />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setShareOpen(true)}
            >
              <Ionicons name="share-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.membershipRow}>
            {isMember ? (
              <Button label="Channel Member" variant="secondary" disabled style={styles.flex} />
            ) : (
              <>
                <Button
                  label={membershipBusy ? 'Starting…' : `Member — $${membershipBasic.toFixed(2)}/mo`}
                  variant="secondary"
                  style={styles.flex}
                  disabled={membershipBusy}
                  onPress={() => handleMembership('basic')}
                />
                <Button
                  label={membershipBusy ? 'Starting…' : `VIP — $${membershipVip.toFixed(2)}/mo`}
                  variant="outline"
                  style={styles.flex}
                  disabled={membershipBusy}
                  onPress={() => handleMembership('premium')}
                />
              </>
            )}
          </View>
          {membershipError ? (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>{membershipError}</Text>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {visibleTabs.map((t) => (
              <Pressable
                key={t}
                style={[styles.tab, tab === t && { borderBottomColor: colors.primary }]}
                onPress={() => setTab(t)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: tab === t ? colors.foreground : colors.mutedForeground },
                    tab === t && styles.tabOnText,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {tab === 'Videos' && (
            <FeedQueryState
              isLoading={videosQuery.isLoading}
              isError={videosQuery.isError}
              error={videosQuery.error}
              onRetry={() => void videosQuery.refetch()}
              isEmpty={!videosQuery.isLoading && longVideos.length === 0}
              emptyTitle="No videos yet"
              emptyMessage="This creator has not uploaded long-form videos."
            >
              {longVideos.map((v) => (
                <VideoCardTile key={v.id} video={v} variant="row" />
              ))}
            </FeedQueryState>
          )}

          {tab === 'Shorts' && (
            <FeedQueryState
              isLoading={videosQuery.isLoading}
              isError={videosQuery.isError}
              error={videosQuery.error}
              onRetry={() => void videosQuery.refetch()}
              isEmpty={!videosQuery.isLoading && shorts.length === 0}
              emptyTitle="No shorts yet"
            >
              <View style={styles.shortsGrid}>
                {shorts.map((v) => (
                  <Pressable
                    key={v.id}
                    style={styles.shortTile}
                    onPress={() => router.push({ pathname: '/(tabs)/shorts', params: { start: v.id } })}
                  >
                    <Image source={{ uri: v.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <Ionicons name="play" size={16} color="#fff" style={styles.shortPlay} />
                  </Pressable>
                ))}
              </View>
            </FeedQueryState>
          )}

          {tab === 'Live' &&
            (profile.isLive && profile.liveStreamId ? (
              <View style={[styles.liveCard, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
                <Text style={{ color: colors.primary, fontWeight: '800', marginBottom: 8 }}>Live now</Text>
                <Button label="Join stream" onPress={() => router.push(`/live/${profile.liveStreamId}`)} />
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 }}>
                No live streams right now. Enable notifications to get alerted.
              </Text>
            ))}

          {tab === 'Playlists' && (
            <FeedQueryState
              isLoading={playlistsQuery.isLoading}
              isError={playlistsQuery.isError}
              error={playlistsQuery.error}
              onRetry={() => void playlistsQuery.refetch()}
              isEmpty={!playlistsQuery.isLoading && (playlistsQuery.data?.length ?? 0) === 0}
              emptyTitle="No playlists"
            >
              {(playlistsQuery.data ?? []).map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.listItem, { borderColor: colors.border }]}
                  onPress={() => router.push(`/playlist/${p.id}`)}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.title}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{p.itemCount} items</Text>
                </Pressable>
              ))}
            </FeedQueryState>
          )}

          {tab === 'Podcasts' && (
            <FeedQueryState
              isLoading={podcastsQuery.isLoading}
              isError={podcastsQuery.isError}
              error={podcastsQuery.error}
              onRetry={() => void podcastsQuery.refetch()}
              isEmpty={!podcastsQuery.isLoading && (podcastsQuery.data?.length ?? 0) === 0}
              emptyTitle="No podcast shows"
            >
              {(podcastsQuery.data ?? []).map((s) => (
                <Pressable key={s.id} style={styles.listItem} onPress={() => router.push('/(tabs)/podcasts')}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{s.title}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {s.episodeCount} episodes
                  </Text>
                </Pressable>
              ))}
            </FeedQueryState>
          )}

          {tab === 'Store' && (
            <FeedQueryState
              isLoading={storeQuery.isLoading}
              isError={storeQuery.isError}
              error={storeQuery.error}
              onRetry={() => void storeQuery.refetch()}
              isEmpty={!storeQuery.isLoading && (storeQuery.data?.products.length ?? 0) === 0}
              emptyTitle="Store is empty"
            >
              <StoreCartLink creatorUsername={profile.username} />
              {(storeQuery.data?.products ?? []).map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.listItem}
                  onPress={() => router.push(`/creator/${profile.username}/store/${p.id}`)}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.title}</Text>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>${p.priceUsd.toFixed(2)}</Text>
                  {!p.inStock && (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Out of stock</Text>
                  )}
                </Pressable>
              ))}
            </FeedQueryState>
          )}

          {tab === 'About' && (
            <Text style={{ color: colors.mutedForeground, lineHeight: 22, marginTop: 8 }}>
              {profile.bio || 'No bio yet.'} Join as a Member for exclusive posts and badges, or VIP for premium perks from this creator.
            </Text>
          )}
        </View>
      </ScrollView>
      <GiftModal
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        receiverId={profile.id}
        receiverName={profile.displayName ?? profile.username}
      />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${profile.displayName ?? profile.username} on Prysym`}
        url={`https://prysym.tv/creator/${profile.username}`}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

function MiniStat({ n, l, colors }: { n: number; l: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.foreground, fontWeight: '800' }}>{formatViewCount(n)}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  banner: { width: '100%', height: 120 },
  pad: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: -28 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3 },
  verified: { position: 'absolute', left: 52, bottom: 0 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 4 },
  name: { ...typography.h2, marginTop: 8 },
  handle: { fontSize: 14 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 19 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  membershipRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1, minWidth: 120 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabs: { marginTop: 20, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 8 },
  tabText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  tabOnText: { fontWeight: '700' },
  shortsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortTile: { width: '31%', aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#111' },
  shortPlay: { position: 'absolute', bottom: 8, left: 8 },
  listItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  liveCard: { padding: 20, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center' },
});
