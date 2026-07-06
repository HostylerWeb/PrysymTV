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
import { StoreCartLink } from '@/components/store/StoreCartLink';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, typography } from '@/theme/tokens';

const TABS = ['Videos', 'Shorts', 'Live', 'Playlists', 'Podcasts', 'Store', 'About'] as const;

export default function CreatorScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const profile = { ...mockCreatorProfile, username: username ?? mockCreatorProfile.username };
  const [tab, setTab] = useState<(typeof TABS)[number]>('Videos');
  const [following, setFollowing] = useState(profile.isFollowing ?? false);
  const [liveAlerts, setLiveAlerts] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const visibleTabs = TABS.filter((t) => t !== 'Store' || profile.hasStore);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={{ uri: profile.bannerUrl ?? '' }} style={styles.banner} contentFit="cover" />
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
          <View style={styles.row}>
            <Image source={{ uri: profile.avatarUrl ?? '' }} style={styles.avatar} contentFit="cover" />
            {profile.isVerified && (
              <View style={styles.verified}><Ionicons name="checkmark-circle" size={14} color={colors.primary} /></View>
            )}
            <View style={styles.stats}>
              <MiniStat n={profile.followersCount} l="Followers" />
              <MiniStat n={profile.videosCount} l="Videos" />
            </View>
          </View>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>

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
            <Button label="Gift" variant="outline" style={styles.flex} onPress={() => requireAuth(() => setGiftOpen(true))} />
            <Pressable style={styles.iconBtn} onPress={() => requireAuth(() => setLiveAlerts(!liveAlerts))}>
              <Ionicons name={liveAlerts ? 'notifications' : 'notifications-outline'} size={22} color={liveAlerts ? colors.primary : colors.foreground} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setShareOpen(true)}>
              <Ionicons name="share-outline" size={22} color={colors.foreground} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => requireAuth(() => setReportOpen(true))}>
              <Ionicons name="flag-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <Button label="Join channel membership" variant="ghost" onPress={() => router.push('/premium')} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {visibleTabs.map((t) => (
              <Pressable key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabOnText]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {tab === 'Videos' && mockVideos.slice(0, 4).map((v) => <VideoCardTile key={v.id} video={v} variant="row" />)}
          {tab === 'Shorts' && mockShorts.slice(0, 3).map((v) => <VideoCardTile key={v.id} video={v} variant="row" />)}
          {tab === 'Live' && mockLiveStreams.map((s) => (
            <Pressable key={s.id} style={styles.listItem} onPress={() => router.push(`/live/${s.id}`)}>
              <Text style={styles.listTitle}>{s.title}</Text>
              <Text style={styles.listMeta}>{s.viewerCount.toLocaleString()} watching · {s.category}</Text>
            </Pressable>
          ))}
          {tab === 'Playlists' && mockPlaylists.map((p) => (
            <Pressable key={p.id} style={styles.listItem} onPress={() => router.push(`/playlist/${p.id}`)}>
              <Text style={styles.listTitle}>{p.title}</Text>
              <Text style={styles.listMeta}>{p.itemCount} items</Text>
            </Pressable>
          ))}
          {tab === 'Podcasts' && mockPodcastShows.map((s) => (
            <Pressable key={s.id} style={styles.listItem} onPress={() => router.push(`/podcast/podcast-ep-1`)}>
              <Text style={styles.listTitle}>{s.title}</Text>
              <Text style={styles.listMeta}>{s.episodeCount} episodes</Text>
            </Pressable>
          ))}
          {tab === 'Store' && (
            <>
              <View style={styles.storeHeader}>
                <Text style={styles.sectionTitle}>Products</Text>
                <StoreCartLink creatorUsername={profile.username} />
              </View>
              {mockStoreProducts.map((p) => (
            <Pressable
              key={p.id}
              style={styles.product}
              onPress={() => router.push(`/creator/${profile.username}/store/${p.id}`)}
            >
              <Image source={{ uri: p.imageUrl ?? '' }} style={styles.productImg} contentFit="cover" />
              <View>
                <Text style={styles.listTitle}>{p.title}</Text>
                <Text style={styles.price}>${p.priceUsd}</Text>
              </View>
            </Pressable>
              ))}
            </>
          )}
          {tab === 'About' && (
            <View style={styles.about}>
              <Text style={styles.bio}>{profile.bio}</Text>
              {['YouTube', 'Instagram', 'X', 'Website'].map((label) => (
                <Pressable key={label} style={styles.socialRow}>
                  <Ionicons name="link-outline" size={16} color={colors.primary} />
                  <Text style={styles.socialText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={profile.displayName ?? profile.username} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

function MiniStat({ n, l }: { n: number; l: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniN}>{n.toLocaleString()}</Text>
      <Text style={styles.miniL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  banner: { width: '100%', height: 140, backgroundColor: colors.secondary },
  pad: { paddingHorizontal: 16, marginTop: -20 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.background },
  verified: { position: 'absolute', left: 52, bottom: 0 },
  stats: { flexDirection: 'row', gap: 20, flex: 1 },
  miniStat: { alignItems: 'center' },
  miniN: { color: colors.foreground, fontWeight: '800' },
  miniL: { color: colors.mutedForeground, fontSize: 10 },
  name: { ...typography.h1, fontSize: 22, color: colors.foreground },
  handle: { color: colors.mutedForeground },
  bio: { color: colors.foreground, fontSize: 14, marginVertical: 10, lineHeight: 20 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  flex: { flex: 1 },
  iconBtn: { padding: 10, backgroundColor: colors.secondary, borderRadius: radius.full },
  tabs: { marginVertical: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.secondary, marginRight: 8 },
  tabOn: { backgroundColor: colors.primary + '30' },
  tabText: { color: colors.mutedForeground, fontWeight: '600', fontSize: 13 },
  tabOnText: { color: colors.primary },
  listItem: { padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  listTitle: { color: colors.foreground, fontWeight: '600' },
  listMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  product: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8 },
  storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.foreground, fontSize: 16, fontWeight: '700' },
  about: { gap: 12, marginTop: 8 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  socialText: { color: colors.foreground, fontWeight: '600' },
  productImg: { width: 56, height: 56, borderRadius: 8 },
  price: { color: colors.primary, marginTop: 4 },
});
