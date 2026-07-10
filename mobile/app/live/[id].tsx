import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileLiveStudioPanel } from '@/components/live/MobileLiveStudioPanel';
import { PlayerShell } from '@/components/video/PlayerShell';
import { LiveGiftPanel } from '@/components/live/LiveGiftPanel';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useStreamDetail } from '@/hooks/api/useStreamDetail';
import { useStreamChat } from '@/hooks/useStreamChat';
import { followUser, toggleLiveAlerts, unfollowUser } from '@/lib/api/users';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

export default function LiveScreen() {
  const { id, studio: studioParam } = useLocalSearchParams<{ id: string; studio?: string }>();
  const insets = useSafeAreaInsets();
  const { user, requireAuth } = useMockAuth();
  const streamQuery = useStreamDetail(id);
  const stream = streamQuery.data;
  const studioMode = studioParam === 'obs' ? 'obs' : 'camera';

  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [draft, setDraft] = useState('');
  const chatRef = useRef<ScrollView>(null);
  const { messages, connected, error: chatError, sendMessage } = useStreamChat(id);

  const sendChat = () => {
    if (!requireAuth(() => {})) return;
    if (sendMessage(draft)) {
      setDraft('');
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 50);
    }
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

  const isOwner = !!user?.id && stream.creatorId === user.id;
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
      />
    );
  }

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
        </View>
        <PlayerShell
          title={stream.title}
          thumbnailUrl={stream.thumbnailUrl}
          playbackUrl={stream.playbackSource}
          subtitle={`${stream.streamer} · ${formatViewCount(stream.viewerCount)} watching`}
          badge="LIVE"
          contentFit="contain"
        />
        <View style={styles.streamerRow}>
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
          <Button label={giftOpen ? 'Hide gifts' : 'Send gift'} variant="secondary" onPress={() => requireAuth(() => setGiftOpen(!giftOpen))} />
          <Button label="Report" variant="ghost" onPress={() => setReportOpen(true)} />
        </View>
        {giftOpen ? (
          <LiveGiftPanel
            receiverId={stream.creatorId}
            streamId={stream.id}
            onSent={() => setGiftOpen(false)}
          />
        ) : null}
        {chatError ? (
          <Text style={styles.chatError}>{chatError}</Text>
        ) : null}
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
      </View>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={stream.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} targetType="stream" targetId={stream.id} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page },
  streamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.page,
    marginBottom: 8,
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
