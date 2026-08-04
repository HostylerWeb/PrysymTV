import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { CreatorPermissionsCard } from '@/components/profile/CreatorPermissionsCard';
import { ProfileMyContent } from '@/components/profile/ProfileMyContent';
import { ProfileStorePanel } from '@/components/profile/ProfileStorePanel';
import { CoinsModal } from '@/components/modals/CoinsModal';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { UnlockFeaturesModal, type CreatorVerificationContext } from '@/components/modals/UnlockFeaturesModal';
import { StreamerApplicationModal } from '@/components/modals/StreamerApplicationModal';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildCreatorShareUrl } from '@/lib/share-url';
import { useMockAuth } from '@/context/MockAuthContext';
import { useProfileLibrary } from '@/hooks/api/useProfileLibrary';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { ProfileSettingsSheet } from '@/components/profile/ProfileSettingsSheet';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import type { ProfileItemCard } from '@/lib/map-profile-items';
import { radius, spacing, typography, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { continueWatchingHref } from '@/lib/continue-watching-nav';
import { formatDuration } from '@/utils/format-media';
import { resolveAvatarUrl, resolveProfileMediaUrl } from '@/lib/media-url';
import { prefetchProfileMedia } from '@/lib/profile-media-cache';

const TABS = [
  { id: 'content', label: 'My content', icon: 'grid-outline' as const },
  { id: 'playlists', label: 'Playlists', icon: 'list-outline' as const },
  { id: 'saved', label: 'Saved', icon: 'bookmark-outline' as const },
  { id: 'liked', label: 'Liked', icon: 'heart-outline' as const },
  { id: 'store', label: 'Store', icon: 'bag-outline' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createProfileStyles);
  const { colors } = useTheme();
  const { settings: settingsParam } = useLocalSearchParams<{ settings?: string }>();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { user, isAuthenticated, logout, refreshUser } = useMockAuth();
  const libraryQuery = useProfileLibrary(isAuthenticated);
  const profile = user;
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

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) void refreshUser();
      if (settingsParam) setSettingsOpen(true);
    }, [isAuthenticated, refreshUser, settingsParam]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      prefetchProfileMedia([
        resolveAvatarUrl(user.avatarUrl, user.username),
        resolveProfileMediaUrl(user.bannerUrl),
      ]);
    }, [user?.avatarUrl, user?.bannerUrl, user?.username]),
  );

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.guestScreen,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.guestContent}>
          <Image source={require('../assets/logo.webp')} style={styles.guestLogo} contentFit="contain" />
          <Text style={styles.guestTitle}>Sign in to your profile</Text>
          <Text style={styles.guestSub}>
            Save videos, pick up where you left off, and manage your account.
          </Text>
          <View style={styles.guestActions}>
            <Button label="Sign in" onPress={() => router.push('/(auth)/login')} />
            <Button
              label="Create account"
              variant="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <FeedQueryState isLoading />
      </View>
    );
  }

  const avatarUri = resolveAvatarUrl(profile.avatarUrl, profile.username);
  const bannerUri = resolveProfileMediaUrl(profile.bannerUrl);
  const visibleTabs = TABS.filter((t) => t.id !== 'store' || profile.storeCreatorStatus === 'approved');

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
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
          <Pressable onPress={() => setEditOpen(true)}>
            {bannerUri ? (
              <Image
                key={bannerUri}
                source={{ uri: bannerUri }}
                style={styles.banner}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.banner, styles.bannerPlaceholder, { backgroundColor: colors.secondary }]} />
            )}
          </Pressable>

          <Pressable style={styles.avatarWrap} onPress={() => setEditOpen(true)}>
            <Image
              key={avatarUri}
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
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
            <Stat label="Followers" value={profile.followersCount} styles={styles} />
            <Stat label="Following" value={profile.followingCount} styles={styles} />
            <Stat label="Videos" value={profile.videosCount} styles={styles} />
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
            {(libraryQuery.data?.continueWatching ?? []).map((item) => {
              const pct = item.durationSeconds
                ? Math.round((item.progressSeconds / item.durationSeconds) * 100)
                : 0;
              return (
                <Pressable
                  key={item.contentId}
                  style={styles.continueCard}
                  onPress={() => router.push(continueWatchingHref(item) as never)}
                >
                  <View style={styles.continueThumb}>
                    <Image source={{ uri: item.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.continueVidTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.continueMeta}>
                    {formatDuration(Math.max(0, item.durationSeconds - item.progressSeconds))} left
                  </Text>
                </Pressable>
              );
            })}
            {!libraryQuery.isLoading && (libraryQuery.data?.continueWatching.length ?? 0) === 0 && (
              <Text style={styles.continueMeta}>Nothing in progress</Text>
            )}
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
          {libraryQuery.isLoading && tab !== 'content' && tab !== 'store' ? (
            <FeedQueryState isLoading />
          ) : null}

          {tab === 'content' && (
            <ProfileMyContent
              onOpenVerticalUpload={() => router.push('/settings/verticals')}
              onOpenPodcastUpload={() => router.push('/settings/podcasts')}
            />
          )}
          {tab === 'playlists' && (
            (libraryQuery.data?.playlists.length ?? 0) === 0 ? (
              <View style={styles.emptyPlaylists}>
                <Ionicons name="list-outline" size={32} color={colors.mutedForeground} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySub}>Create playlists to organize your favorite content.</Text>
                <Button label="Manage playlists" variant="outline" onPress={() => router.push('/settings/playlists')} />
              </View>
            ) : (
              libraryQuery.data!.playlists.map((p) => (
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
          {tab === 'saved' && (
            (libraryQuery.data?.saved.length ?? 0) === 0 ? (
              <Text style={styles.emptySub}>No saved items yet.</Text>
            ) : (
              <View style={styles.contentGrid}>
                {libraryQuery.data!.saved.map((item) => (
                  <ProfileLibraryCard key={item.key} item={item} styles={styles} />
                ))}
              </View>
            )
          )}
          {tab === 'liked' && (
            (libraryQuery.data?.liked.length ?? 0) === 0 ? (
              <Text style={styles.emptySub}>No liked items yet.</Text>
            ) : (
              <View style={styles.contentGrid}>
                {libraryQuery.data!.liked.map((item) => (
                  <ProfileLibraryCard key={item.key} item={item} styles={styles} />
                ))}
              </View>
            )
          )}
          {tab === 'store' && <ProfileStorePanel />}
        </View>

        <Button label="Log out" variant="outline" onPress={logout} style={styles.logout} />
      </ScrollView>

      {settingsOpen && (
        <ProfileSettingsSheet
          visible={settingsOpen}
          user={profile}
          initialScreen={settingsScreen}
          onClose={() => { setSettingsOpen(false); setSettingsScreen(undefined); }}
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
        url={buildCreatorShareUrl(profile.username)}
      />
      {flowHost}
    </>
  );
}

function ProfileLibraryCard({
  item,
  styles,
}: {
  item: ProfileItemCard;
  styles: ReturnType<typeof createProfileStyles>;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.gridHalf}
      onPress={() => {
        if (typeof item.route === 'string') router.push(item.route as never);
        else router.push(item.route as never);
      }}
    >
      <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.libraryThumb} contentFit="cover" />
      <Text style={styles.continueVidTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.continueMeta}>{item.label}</Text>
    </Pressable>
  );
}

function Stat({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof createProfileStyles>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function createProfileStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  guestScreen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.page,
    justifyContent: 'center',
  },
  guestContent: { alignItems: 'center', width: '100%', maxWidth: 320, alignSelf: 'center' },
  guestLogo: { width: 140, height: 36, marginBottom: 24 },
  guestTitle: { ...typography.h2, color: colors.foreground, textAlign: 'center', marginBottom: 8 },
  guestSub: {
    color: colors.mutedForeground,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  guestActions: { width: '100%', gap: 10 },
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
  hero: { paddingBottom: 8 },
  banner: {
    width: '100%',
    height: 140,
  },
  bannerPlaceholder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: -48,
    marginBottom: 12,
  },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 },
  name: { fontSize: 22, fontWeight: '800', color: colors.foreground },
  streamerBadge: { backgroundColor: colors.success + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  streamerBadgeText: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  handle: { color: colors.mutedForeground, fontSize: 14, marginTop: 2, textAlign: 'center', paddingHorizontal: 16 },
  bio: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginTop: 8, maxWidth: 320, alignSelf: 'center', paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center', paddingHorizontal: 16 },
  creatorAccessWrap: { marginTop: 20, paddingHorizontal: 16 },
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
  libraryThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    marginBottom: 6,
  },
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
  emptyPlaylists: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { color: colors.foreground, fontWeight: '700', fontSize: 16 },
  emptySub: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  legalHeader: { color: colors.mutedForeground, fontSize: 11, fontWeight: '700', marginTop: 16, marginBottom: 4, letterSpacing: 1 },
  });
}
