import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { GiftModal } from '@/components/modals/GiftModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import {
  mockCreatorProfile,
  mockLiveStreams,
  mockPlaylists,
  mockPodcastShows,
  mockShorts,
  mockStoreProducts,
  mockVideos,
} from '@/mocks';
import { MEMBERSHIP_PRICES } from '@/mocks/monetization';
import { StoreCartLink } from '@/components/store/StoreCartLink';
import { useMockAuth } from '@/context/MockAuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

const TABS = ['Videos', 'Shorts', 'Live', 'Playlists', 'Podcasts', 'Store', 'About'] as const;

export default function CreatorScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { requireAuth } = useMockAuth();
  const profile = { ...mockCreatorProfile, username: username ?? mockCreatorProfile.username };
  const [tab, setTab] = useState<(typeof TABS)[number]>('Videos');
  const [following, setFollowing] = useState(profile.isFollowing ?? false);
  const [liveAlerts, setLiveAlerts] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membershipTier, setMembershipTier] = useState<'basic' | 'premium' | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const visibleTabs = TABS.filter((t) => t !== 'Store' || profile.hasStore);

  const handleMembership = (tier: 'basic' | 'premium') => {
    requireAuth(() => {
      setIsMember(true);
      setMembershipTier(tier);
    });
  };

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={{ uri: profile.bannerUrl ?? '' }} style={styles.banner} contentFit="cover" />
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
          <View style={styles.row}>
            <Image source={{ uri: profile.avatarUrl ?? '' }} style={[styles.avatar, { borderColor: colors.background }]} contentFit="cover" />
            {profile.isVerified && (
              <View style={styles.verified}><Ionicons name="checkmark-circle" size={14} color={colors.primary} /></View>
            )}
            <View style={styles.stats}>
              <MiniStat n={profile.followersCount} l="Followers" colors={colors} />
              <MiniStat n={profile.videosCount} l="Videos" colors={colors} />
            </View>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{profile.displayName}</Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile.username}</Text>
          <Text style={[styles.bio, { color: colors.mutedForeground }]}>{profile.bio}</Text>

          {profile.isLive && (
            <Button label="● Watch live" onPress={() => router.push(`/live/${profile.liveStreamId}`)} style={{ marginBottom: 10 }} />
          )}

          <View style={styles.btns}>
            <Button
              label={following ? 'Following' : 'Follow'}
              variant={following ? 'secondary' : 'primary'}
              style={styles.flex}
              onPress={() => requireAuth(() => setFollowing(!following))}
            />
            <Button label="Tip" variant="outline" style={styles.flex} onPress={() => requireAuth(() => setGiftOpen(true))} />
            <Pressable style={[styles.iconBtn, { backgroundColor: colors.secondary }]} onPress={() => requireAuth(() => setLiveAlerts(!liveAlerts))}>
              <Ionicons name={liveAlerts ? 'notifications' : 'notifications-outline'} size={22} color={liveAlerts ? colors.primary : colors.foreground} />
            </Pressable>
            <Pressable style={[styles.iconBtn, { backgroundColor: colors.secondary }]} onPress={() => setShareOpen(true)}>
              <Ionicons name="share-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.membershipRow}>
            {isMember ? (
              <Button
                label={membershipTier === 'premium' ? 'VIP Member' : 'Channel Member'}
                variant="secondary"
                disabled
                style={styles.flex}
              />
            ) : (
              <>
                <Button
                  label={`Member — $${MEMBERSHIP_PRICES.channelBasic.toFixed(2)}/mo`}
                  variant="secondary"
                  style={styles.flex}
                  onPress={() => handleMembership('basic')}
                />
                <Button
                  label={`VIP — $${MEMBERSHIP_PRICES.channelVip.toFixed(2)}/mo`}
                  variant="outline"
                  style={styles.flex}
                  onPress={() => handleMembership('premium')}
                />
              </>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {visibleTabs.map((t) => (
              <Pressable
                key={t}
                style={[styles.tab, tab === t && { borderBottomColor: colors.primary }]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }, tab === t && styles.tabOnText]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {tab === 'Videos' && mockVideos.slice(0, 4).map((v) => <VideoCardTile key={v.id} video={v} variant="row" />)}
          {tab === 'Shorts' && (
            <View style={styles.shortsGrid}>
              {mockShorts.slice(0, 6).map((v) => (
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
          )}
          {tab === 'Live' && mockLiveStreams.map((s) => (
            <Pressable key={s.id} style={styles.listItem} onPress={() => router.push(`/live/${s.id}`)}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{s.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{s.viewerCount.toLocaleString()} watching</Text>
            </Pressable>
          ))}
          {tab === 'Playlists' && mockPlaylists.map((p) => (
            <Pressable key={p.id} style={[styles.listItem, { borderColor: colors.border }]} onPress={() => router.push(`/playlist/${p.id}`)}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{p.itemCount} items</Text>
            </Pressable>
          ))}
          {tab === 'Podcasts' && mockPodcastShows.map((s) => (
            <Pressable key={s.id} style={styles.listItem} onPress={() => router.push(`/podcast/${s.id}`)}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{s.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{s.episodeCount} episodes</Text>
            </Pressable>
          ))}
          {tab === 'Store' && (
            <>
              <StoreCartLink creatorUsername={profile.username} />
              {mockStoreProducts.map((p) => (
                <Pressable key={p.id} style={styles.listItem} onPress={() => router.push(`/creator/${profile.username}/store/${p.id}`)}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.title}</Text>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>${p.priceUsd}</Text>
                </Pressable>
              ))}
            </>
          )}
          {tab === 'About' && (
            <Text style={{ color: colors.mutedForeground, lineHeight: 22, marginTop: 8 }}>
              {profile.bio} Join as a Member for exclusive posts and badges, or VIP for premium perks from this creator.
            </Text>
          )}
        </View>
      </ScrollView>
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${profile.displayName} on Prysym`}
        url={`https://prysym.tv/creator/${profile.username}`}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

function MiniStat({ n, l, colors }: { n: number; l: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.foreground, fontWeight: '800' }}>{n.toLocaleString()}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  banner: { width: '100%', height: 120 },
  pad: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: -28 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3 },
  verified: { position: 'absolute', left: 52, bottom: 0 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 4 },
  name: { ...typography.h2, marginTop: 8 },
  handle: { fontSize: 14 },
  bio: { fontSize: 13, marginTop: 8, lineHeight: 19 },
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
});
