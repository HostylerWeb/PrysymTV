import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { CreatorPermissionsCard } from '@/components/profile/CreatorPermissionsCard';
import { ProfileMyContent } from '@/components/profile/ProfileMyContent';
import { ProfileStorePanel } from '@/components/profile/ProfileStorePanel';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { CoinsModal } from '@/components/modals/CoinsModal';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { UnlockFeaturesModal, type CreatorVerificationContext } from '@/components/modals/UnlockFeaturesModal';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { ShareModal } from '@/components/modals/ShareModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { ProfileSettingsSheet } from '@/components/profile/ProfileSettingsSheet';
import { mockContinueWatching, mockPlaylists, mockUser, mockVideos } from '@/mocks';
import { colors, radius, typography, withAlpha } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

const TABS = [
  { id: 'content', label: 'My content', icon: 'grid-outline' as const },
  { id: 'playlists', label: 'Playlists', icon: 'list-outline' as const },
  { id: 'saved', label: 'Saved', icon: 'bookmark-outline' as const },
  { id: 'liked', label: 'Liked', icon: 'heart-outline' as const },
  { id: 'store', label: 'Store', icon: 'bag-outline' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { settings: settingsParam } = useLocalSearchParams<{ settings?: string }>();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { user, isAuthenticated, logout } = useMockAuth();
  const profile = user ?? mockUser;
  const [tab, setTab] = useState('content');
  const [settingsOpen, setSettingsOpen] = useState(!!settingsParam);
  const [settingsScreen, setSettingsScreen] = useState<string | undefined>(settingsParam);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [streamerOpen, setStreamerOpen] = useState(false);
  const [verifyContext, setVerifyContext] = useState<CreatorVerificationContext | null>(null);
  const { trigger, flowHost } = useCreateFlow();
  const [shareOpen, setShareOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const visibleTabs = TABS.filter((t) => t.id !== 'store' || profile.storeCreatorStatus === 'approved');

  if (!isAuthenticated) {
    const GUEST_FEATURES = [
      { icon: 'bookmark-outline' as const, title: 'Save favorites', sub: 'Build your watchlist across videos, movies, and podcasts' },
      { icon: 'time-outline' as const, title: 'Continue watching', sub: 'Pick up right where you left off on any device' },
      { icon: 'radio-outline' as const, title: 'Become a streamer', sub: 'Apply to go live and unlock creator tools' },
    ];
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Text style={styles.guestEmoji}>👋</Text>
        <Text style={styles.guestTitle}>Welcome to Prysym TV</Text>
        <Text style={styles.guestSub}>Sign in to access your profile, save videos, and track watch history.</Text>
        {GUEST_FEATURES.map((f) => (
          <View key={f.title} style={styles.guestFeature}>
            <Ionicons name={f.icon} size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestFeatureTitle}>{f.title}</Text>
              <Text style={styles.guestFeatureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
        <Button label="Sign in" onPress={() => router.push('/(auth)/login')} style={{ width: '100%', maxWidth: 280, marginTop: 16 }} />
        <Button label="Create account" variant="secondary" onPress={() => router.push('/(auth)/register')} style={{ marginTop: 8, width: '100%', maxWidth: 280 }} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: tabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky-style header */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.roundBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.topTitle}>Profile</Text>
          <View style={styles.topActions}>
            <Pressable style={styles.roundBtn} onPress={() => trigger('menu')}>
              <Ionicons name="add" size={22} color={colors.foreground} />
            </Pressable>
            <Pressable style={styles.roundBtn} onPress={() => setSettingsOpen(true)}>
              <Ionicons name="settings-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Profile hero */}
        <View style={styles.hero}>
          <Pressable style={styles.avatarWrap} onPress={() => setEditOpen(true)}>
            <Image source={{ uri: profile.avatarUrl ?? '' }} style={styles.avatar} contentFit="cover" />
            <Pressable style={styles.editFab} onPress={() => setEditOpen(true)}>
              <Ionicons name="pencil" size={14} color={colors.primaryForeground} />
            </Pressable>
            {profile.streamerStatus === 'approved' && (
              <View style={styles.streamerDot}>
                <Ionicons name="radio" size={12} color={colors.primaryForeground} />
              </View>
            )}
          </Pressable>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.displayName}</Text>
            {profile.streamerStatus === 'approved' && (
              <View style={styles.streamerBadge}>
                <Text style={styles.streamerBadgeText}>STREAMER</Text>
              </View>
            )}
          </View>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.actionRow}>
            <Button label="Edit Profile" onPress={() => setEditOpen(true)} style={styles.actionBtn} />
            <Button label="Share" variant="outline" onPress={() => setShareOpen(true)} style={styles.actionBtn} />
            {profile.streamerStatus === 'approved' && (
              <Button label="Go Live" onPress={() => router.push('/go-live')} style={styles.goLiveBtn} />
            )}
          </View>

          <View style={styles.creatorAccessWrap}>
            <CreatorPermissionsCard
            user={profile}
            onUnlock={() => setUnlockOpen(true)}
            onApplyLive={() => {
              setVerifyContext({ features: ['live'] });
              setStreamerOpen(true);
            }}
            onApplyVertical={() => {
              setVerifyContext({ features: ['vertical'] });
              setStreamerOpen(true);
            }}
            />
          </View>

          <Pressable style={styles.coinsPill} onPress={() => setCoinsOpen(true)}>
            <Text style={styles.coinsEmoji}>🪙</Text>
            <Text style={styles.coinsVal}>{profile.coinsBalance.toLocaleString()}</Text>
            <Text style={styles.coinsMore}>+ Get More</Text>
          </Pressable>

          <View style={styles.statsRow}>
            <Stat label="Followers" value={profile.followersCount} />
            <Stat label="Following" value={profile.followingCount} />
            <Stat label="Videos" value={profile.videosCount} />
          </View>
        </View>

        {/* Continue watching */}
        <View style={styles.continueBlock}>
          <View style={styles.continueHeader}>
            <View style={styles.continueTitleRow}>
              <Ionicons name="time-outline" size={16} color={colors.foreground} />
              <Text style={styles.continueTitle}>Continue Watching</Text>
            </View>
            <Pressable onPress={() => router.push('/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continueRow}>
            {mockContinueWatching.map((item) => {
              const pct = Math.round((item.progressSeconds / item.durationSeconds) * 100);
              return (
                <Pressable
                  key={item.contentId}
                  style={styles.continueCard}
                  onPress={() => {
                    if (item.contentType === 'video') router.push(`/watch/${item.contentId}`);
                    else if (item.contentType === 'podcast_episode') router.push(`/podcast/${item.contentId}`);
                    else router.push(`/verticals/watch/${item.seriesSlug ?? 'series-1'}/5`);
                  }}
                >
                  <View style={styles.continueThumb}>
                    <Image source={{ uri: item.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.continueVidTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.continueMeta}>{formatDuration(item.durationSeconds - item.progressSeconds)} left</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Column tabs — matches web profile */}
        <View style={styles.tabBarColumn}>
          {visibleTabs.map((t) => {
            const active = tab === t.id;
            return (
              <Pressable key={t.id} style={[styles.tabColItem, active && styles.tabColItemOn]} onPress={() => setTab(t.id)}>
                <Ionicons name={t.icon} size={18} color={active ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.tabColLabel, active && styles.tabColLabelOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabContent}>
          {tab === 'content' && (
            <ProfileMyContent
              onOpenVerticalUpload={() => router.push('/settings/verticals')}
              onOpenPodcastUpload={() => router.push('/settings/podcasts')}
            />
          )}
          {tab === 'playlists' && (
            mockPlaylists.length === 0 ? (
              <View style={styles.emptyPlaylists}>
                <Ionicons name="list-outline" size={32} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySub}>Create playlists to organize your favorite content.</Text>
                <Button label="Manage playlists" variant="outline" onPress={() => router.push('/settings/playlists')} />
              </View>
            ) : (
              mockPlaylists.map((p) => (
                <Pressable key={p.id} style={styles.playlist} onPress={() => router.push(`/playlist/${p.id}`)}>
                  <Ionicons name="list" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playlistTitle}>{p.title}</Text>
                    <Text style={styles.playlistMeta}>{p.itemCount} items</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))
            )
          )}
          {tab === 'saved' && mockVideos.slice(2, 6).map((v) => (
            <VideoCardTile key={v.id} video={v} variant="grid" />
          ))}
          {tab === 'liked' && mockVideos.filter((v) => v.liked).map((v) => (
            <VideoCardTile key={v.id} video={v} variant="grid" />
          ))}
          {tab === 'store' && <ProfileStorePanel />}
        </View>

        <Button label="Log out" variant="outline" onPress={logout} style={styles.logout} />
      </ScrollView>

      {settingsOpen && (
        <ProfileSettingsSheet
          visible={settingsOpen}
          user={profile}
          darkMode={darkMode}
          initialScreen={settingsScreen}
          onClose={() => { setSettingsOpen(false); setSettingsScreen(undefined); }}
          onDarkMode={setDarkMode}
          onCoins={() => { setSettingsOpen(false); setCoinsOpen(true); }}
          onStreamerApply={() => { setSettingsOpen(false); setStreamerOpen(true); }}
          onUnlockFeatures={() => { setSettingsOpen(false); setUnlockOpen(true); }}
          onLogout={() => { setSettingsOpen(false); logout(); }}
        />
      )}
      <CoinsModal visible={coinsOpen} onClose={() => setCoinsOpen(false)} balance={profile.coinsBalance} />
      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
      <UnlockFeaturesModal
        visible={unlockOpen}
        user={profile}
        onClose={() => setUnlockOpen(false)}
        onNeedVerification={(ctx) => {
          setVerifyContext(ctx);
          setUnlockOpen(false);
          setStreamerOpen(true);
        }}
      />
      <StreamerApplicationModal
        visible={streamerOpen}
        user={profile}
        onClose={() => {
          setStreamerOpen(false);
          setVerifyContext(null);
        }}
        features={
          verifyContext?.features.includes('live') && verifyContext?.features.includes('vertical')
            ? ['live', 'vertical']
            : verifyContext?.features.includes('vertical')
              ? ['vertical']
              : verifyContext?.features.includes('live')
                ? ['live']
                : ['live', 'vertical']
        }
        initialDescription={verifyContext?.description}
      />
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${profile.displayName} on Prysym`}
        url={`https://prysym.tv/creator/${profile.username}`}
      />
      {flowHost}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestEmoji: { fontSize: 48, marginBottom: 12 },
  guestTitle: { ...typography.h1, color: colors.foreground, marginBottom: 8 },
  guestSub: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 20, maxWidth: 300 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: withAlpha(colors.background, 0.95),
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.secondary, 0.4),
  },
  topTitle: { ...typography.h3, color: colors.foreground, fontWeight: '700', flex: 1, textAlign: 'center' },
  topActions: { flexDirection: 'row', gap: 4 },
  hero: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  editFab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamerDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '800', color: colors.foreground },
  streamerBadge: { backgroundColor: colors.success + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  streamerBadgeText: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  handle: { color: colors.mutedForeground, fontSize: 14, marginTop: 2 },
  bio: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginTop: 8, maxWidth: 320 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  creatorAccessWrap: { marginTop: 20 },
  actionBtn: { minWidth: 110 },
  goLiveBtn: { minWidth: 110, backgroundColor: colors.primary },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: withAlpha(colors.yellow, 0.3),
    backgroundColor: withAlpha(colors.yellow, 0.12),
  },
  coinsEmoji: { fontSize: 20 },
  coinsVal: { fontSize: 18, fontWeight: '800', color: colors.foreground },
  coinsMore: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, paddingVertical: 8 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.foreground },
  statLabel: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  continueBlock: { marginTop: 8, marginBottom: 8 },
  continueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  continueTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  continueTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  seeAll: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  continueRow: { paddingHorizontal: 16, gap: 12 },
  continueCard: { width: 176 },
  continueThumb: { aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.muted, marginBottom: 6 },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.muted },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  continueVidTitle: { color: colors.foreground, fontSize: 12, fontWeight: '600' },
  continueMeta: { color: colors.mutedForeground, fontSize: 11 },
  tabBarColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tabColItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabColItemOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  tabColLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground },
  tabColLabelOn: { color: colors.primary },
  tabContent: { paddingHorizontal: 16, paddingTop: 16 },
  contentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridHalf: { width: '48%' },
  playlist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  playlistTitle: { color: colors.foreground, fontWeight: '600' },
  playlistMeta: { color: colors.mutedForeground, fontSize: 12 },
  logout: { marginHorizontal: 16, marginTop: 24 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { ...typography.h2, color: colors.foreground },
  sheetBody: { padding: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, color: colors.foreground, fontSize: 15 },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.25),
  },
  premiumTitle: { color: colors.foreground, fontWeight: '800', fontSize: 15 },
  premiumSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  guestFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    maxWidth: 320,
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestFeatureTitle: { color: colors.foreground, fontWeight: '700' },
  guestFeatureSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 4, lineHeight: 18 },
  emptyPlaylists: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { color: colors.foreground, fontWeight: '700', fontSize: 16 },
  emptySub: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  legalHeader: { color: colors.mutedForeground, fontSize: 11, fontWeight: '700', marginTop: 16, marginBottom: 4, letterSpacing: 1 },
});
