import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileLiveStudioPanel } from '@/components/live/MobileLiveStudioPanel';
import { LiveBroadcastPlayer } from '@/components/live/LiveBroadcastPlayer';
import { LiveImmersiveWatch } from '@/components/live/LiveImmersiveWatch';
import { LiveGiftPanel } from '@/components/live/LiveGiftPanel';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { buildShareUrl } from '@/lib/share-url';
import { ReportModal } from '@/components/modals/ReportModal';
import { CoinsModal } from '@/components/modals/CoinsModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useStreamDetail } from '@/hooks/api/useStreamDetail';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useStreamChat } from '@/hooks/useStreamChat';
import { unlockStream } from '@/lib/api/streams';
import { followUser, toggleLiveAlerts, unfollowUser } from '@/lib/api/users';
import { colors, radius, spacing } from '@/theme/tokens';
import { resolveAvatarUrl } from '@/lib/media-url';

export default function LiveScreen() {
  const { id, studio: studioParam } = useLocalSearchParams<{ id: string; studio?: string }>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { user, requireAuth, refreshUser } = useMockAuth();
  useBackNavigation('/live');
  const streamQuery = useStreamDetail(id, user?.id);
  const stream = streamQuery.data;
  const studioMode = studioParam === 'obs' ? 'obs' : 'camera';

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [draft, setDraft] = useState('');
  const [immersive, setImmersive] = useState(false);
  const chatRef = useRef<ScrollView>(null);

  const isOwner = !!user?.id && stream?.creatorId === user.id;
  const needsPaywall = Boolean(stream?.isPaid) && !stream?.hasAccess && !isOwner;
  const chatStreamId = needsPaywall ? undefined : id;
  const { messages, connected, viewerCount: liveViewerCount, error: chatError, sendMessage } = useStreamChat(chatStreamId);
  const userCoins = user?.coinsBalance ?? 0;

  const sendChat = () => {
    if (!requireAuth(() => {})) return;
    if (sendMessage(draft)) {
      setDraft('');
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const handleUnlock = async () => {
    if (!stream) return;
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      await unlockStream(stream.id);
      await refreshUser();
      await streamQuery.refetch();
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : 'Could not unlock stream');
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleUnlockPress = () => {
    if (!stream) return;
    const entryCost = stream.entryCoinCost ?? 0;
    if (userCoins < entryCost) {
      setCoinsOpen(true);
      return;
    }
    void handleUnlock();
  };

  const handleLoginToView = () => {
    requireAuth(() => {
      void refreshUser().then(() => streamQuery.refetch());
    });
  };

  if (streamQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (streamQuery.isError || !stream) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={streamQuery.error} onRetry={() => void streamQuery.refetch()} />
      </View>
    );
  }

  if (isOwner && stream.status !== 'ended' && studioParam) {
    return (
      <MobileLiveStudioPanel
        stream={{
          id: stream.id,
          slug: stream.slug,
          title: stream.title,
          thumbnail: stream.thumbnailUrl,
          streamer: stream.streamer,
          streamerSlug: stream.streamerSlug,
          streamerAvatar: stream.avatarUrl,
          viewers: String(stream.viewerCount),
          viewerCount: stream.viewerCount,
          category: stream.category,
          status: stream.status,
          startedAgo: '',
          creatorId: stream.creatorId,
          studio: stream.studio,
        }}
        mode={studioMode}
        viewerCount={stream.viewerCount}
        playbackUrl={stream.playbackSource}
      />
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
        </View>
        {needsPaywall ? (
          <View style={styles.paywall}>
            {stream.thumbnailUrl ? (
              <Image source={{ uri: stream.thumbnailUrl }} style={styles.paywallImage} blurRadius={12} />
            ) : (
              <View style={styles.paywallImage} />
            )}
            <View style={styles.paywallOverlay}>
              <Ionicons name="lock-closed" size={40} color="#fbbf24" />
              <Text style={styles.paywallTitle}>Paid VIP Live Stream</Text>
              <Text style={styles.paywallBody}>
                {!user
                  ? `Sign in to watch this VIP stream. Entry costs ${stream.entryCoinCost?.toLocaleString() ?? '—'} coins${
                      stream.entryPriceUsd != null ? ` ($${stream.entryPriceUsd.toFixed(2)})` : ''
                    } after you log in.`
                  : `You need ${stream.entryCoinCost?.toLocaleString() ?? '—'} coins to join this VIP stream${
                      stream.entryPriceUsd != null ? ` ($${stream.entryPriceUsd.toFixed(2)})` : ''
                    }.`}
              </Text>
              {user ? (
                <Text style={styles.paywallBalance}>
                  Your balance: 🪙 {userCoins.toLocaleString()}
                  {userCoins < (stream.entryCoinCost ?? 0) ? (
                    <Text style={styles.paywallNeed}>
                      {' '}
                      · Need {(stream.entryCoinCost ?? 0) - userCoins} more to unlock
                    </Text>
                  ) : null}
                </Text>
              ) : null}
              {!user ? (
                <Button
                  label="Login To View"
                  onPress={handleLoginToView}
                  style={{ marginTop: 12, alignSelf: 'stretch' }}
                />
              ) : (
                <>
                  <Button
                    label={
                      unlockBusy
                        ? 'Unlocking…'
                        : `Unlock · ${stream.entryCoinCost?.toLocaleString() ?? '—'} coins`
                    }
                    onPress={handleUnlockPress}
                    disabled={unlockBusy}
                    style={{ marginTop: 12, alignSelf: 'stretch' }}
                  />
                  <Button
                    label="Get coins"
                    variant="outline"
                    onPress={() => setCoinsOpen(true)}
                    style={{ marginTop: 8, alignSelf: 'stretch' }}
                  />
                </>
              )}
              {unlockError ? <Text style={styles.unlockError}>{unlockError}</Text> : null}
            </View>
          </View>
        ) : stream.status === 'live' && (stream.webrtcPlaybackUrl || stream.hlsPlaybackUrl || stream.playbackSource) ? (
          <View style={styles.playerWrap}>
            <LiveBroadcastPlayer
              webrtcUrl={stream.webrtcPlaybackUrl}
              hlsUrl={stream.hlsPlaybackUrl ?? stream.playbackSource}
              posterUrl={stream.thumbnailUrl}
              contentFit="cover"
              paused={!isFocused || immersive}
              isLive
              autoPlay
            />
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>{stream.isPaid ? 'VIP' : 'LIVE'}</Text>
            </View>
            <Pressable
              style={styles.fullscreenBtn}
              onPress={() => setImmersive(true)}
              accessibilityLabel="Fullscreen"
            >
              <Ionicons name="expand-outline" size={20} color={colors.onVideo} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.playerWrap}>
            {stream.thumbnailUrl ? (
              <Image source={{ uri: stream.thumbnailUrl }} style={styles.offlinePoster} />
            ) : (
              <View style={styles.offlinePoster} />
            )}
          </View>
        )}
        <View style={styles.streamerRow}>
          <Image
            source={{ uri: resolveAvatarUrl(stream.avatarUrl, stream.streamerSlug ?? stream.streamer) }}
            style={styles.streamerAvatar}
          />
          <View style={styles.streamerInfo}>
            <Text style={styles.streamerName}>{stream.streamer}</Text>
            <Text style={styles.streamerSub}>
              {connected ? 'Live on Prysym TV' : 'Stream ended or offline'}
            </Text>
          </View>
          <Button
            label={following ? 'Following' : 'Follow'}
            variant={following ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => requireAuth(async () => {
              if (following) {
                await unfollowUser(stream.streamerSlug);
                setFollowing(false);
              } else {
                await followUser(stream.streamerSlug);
                setFollowing(true);
              }
            })}
          />
          <Pressable
            style={[styles.alertBtn, alertsOn && styles.alertBtnOn]}
            onPress={() => requireAuth(async () => {
              const res = await toggleLiveAlerts(stream.streamerSlug);
              setAlertsOn(res.enabled);
            })}
          >
            <Ionicons name={alertsOn ? 'notifications' : 'notifications-outline'} size={18} color={alertsOn ? colors.primary : colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.topActions}>
          <Button label="Share" variant="outline" onPress={() => setShareOpen(true)} />
          {!needsPaywall ? (
            <Button label={giftOpen ? 'Hide gifts' : 'Send gift'} variant="secondary" onPress={() => requireAuth(() => setGiftOpen(!giftOpen))} />
          ) : null}
          <Button label="Report" variant="ghost" onPress={() => setReportOpen(true)} />
        </View>
        {!needsPaywall && giftOpen ? (
          <LiveGiftPanel
            receiverId={stream.creatorId}
            streamId={stream.id}
            onSent={() => setGiftOpen(false)}
          />
        ) : null}
        {!needsPaywall && chatError ? (
          <Text style={styles.chatError}>{chatError}</Text>
        ) : null}
        {!needsPaywall ? (
        <>
        <ScrollView
          ref={chatRef}
          style={styles.chat}
          contentContainerStyle={[styles.chatContent, { paddingBottom: spacing.md }]}
          onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((m) => (
            <Text key={m.id} style={styles.chatLine}>
              <Text style={styles.chatUser}>@{m.user}: </Text>
              {m.type === 'gift' ? `🎁 ${m.message}` : m.message}
            </Text>
          ))}
        </ScrollView>
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            placeholder={user ? 'Say something...' : 'Sign in to chat'}
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => { if (!user) requireAuth(); }}
            editable={!!user && connected}
            onSubmitEditing={sendChat}
            returnKeyType="send"
          />
          <Button label="Send" style={styles.sendBtn} onPress={sendChat} disabled={!draft.trim() || !connected} />
        </View>
        </>
        ) : null}
      </View>
      <ShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={stream.title}
        url={buildShareUrl(`/live/${stream.id}`)}
        targetId={stream.id}
      />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="stream" targetId={stream.id} />
      <CoinsModal visible={coinsOpen} onClose={() => setCoinsOpen(false)} balance={userCoins} />
      {!needsPaywall && stream.status === 'live' ? (
        <LiveImmersiveWatch
          visible={immersive}
          onClose={() => setImmersive(false)}
          title={stream.title}
          streamer={stream.streamer}
          viewerCount={liveViewerCount > 0 ? liveViewerCount : stream.viewerCount}
          isPaid={stream.isPaid}
          webrtcUrl={stream.webrtcPlaybackUrl}
          hlsUrl={stream.hlsPlaybackUrl ?? stream.playbackSource}
          posterUrl={stream.thumbnailUrl}
          paused={!isFocused}
          creatorId={stream.creatorId}
          streamId={stream.id}
          messages={messages}
          connected={connected}
          chatError={chatError}
          draft={draft}
          onDraftChange={setDraft}
          onSendChat={sendChat}
          canChat={!!user}
          giftOpen={giftOpen}
          onToggleGift={() => requireAuth(() => setGiftOpen(!giftOpen))}
          onGiftSent={() => setGiftOpen(false)}
          onOpenShare={() => setShareOpen(true)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page },
  paywall: {
    marginHorizontal: spacing.page,
    borderRadius: radius.lg,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: '#111',
    marginBottom: 12,
  },
  paywallImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paywallTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  paywallBody: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  paywallBalance: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, textAlign: 'center' },
  paywallNeed: { color: '#fbbf24' },
  unlockError: { color: colors.destructive, fontSize: 12, marginTop: 8, textAlign: 'center' },
  playerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.videoBackground,
    position: 'relative',
  },
  offlinePoster: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.secondary,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.live,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    zIndex: 2,
  },
  liveBadgeText: { color: colors.onVideo, fontSize: 10, fontWeight: '800' },
  fullscreenBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  streamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.page,
    marginBottom: 8,
  },
  streamerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  streamerInfo: { flex: 1 },
  streamerName: { color: colors.foreground, fontWeight: '700', fontSize: 15 },
  streamerSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  alertBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnOn: { backgroundColor: colors.primary + '20' },
  topActions: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.page, marginBottom: 4 },
  chatError: { color: colors.mutedForeground, fontSize: 12, paddingHorizontal: spacing.page, marginBottom: 4 },
  chat: { flex: 1, marginTop: 8 },
  chatContent: { padding: spacing.page, gap: 8 },
  chatLine: { color: colors.foreground, fontSize: 14 },
  chatUser: { color: colors.primary, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.page,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.foreground,
  },
  sendBtn: { paddingHorizontal: 14 },
});
