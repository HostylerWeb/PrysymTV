import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { PlayerShell } from '@/components/video/PlayerShell';
import { LiveGiftPanel } from '@/components/live/LiveGiftPanel';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockChatMessages, mockLiveStreams } from '@/mocks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

type ChatMessage = { id: string; user: string; message: string };

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, requireAuth } = useMockAuth();
  const stream = mockLiveStreams.find((s) => s.id === id) ?? mockLiveStreams[0];
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const chatRef = useRef<ScrollView>(null);

  const sendChat = () => {
    if (!requireAuth(() => {})) return;
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, user: user?.username ?? 'you', message: body },
    ]);
    setDraft('');
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <>
      <View style={styles.screen}>
        <View style={styles.pad}>
          <AppHeader showBack showSearch={false} showNotifications={false} />
        </View>
        <PlayerShell
          title={stream.title}
          thumbnailUrl={stream.thumbnailUrl}
          subtitle={`${stream.streamer} · ${formatViewCount(stream.viewerCount)} watching`}
          badge="LIVE"
        />
        <View style={styles.streamerRow}>
          <View style={styles.streamerInfo}>
            <Text style={styles.streamerName}>{stream.streamer}</Text>
            <Text style={styles.streamerSub}>Live on Prysym TV</Text>
          </View>
          <Button
            label={following ? 'Following' : 'Follow'}
            variant={following ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => requireAuth(() => setFollowing(!following))}
          />
          <Pressable
            style={[styles.alertBtn, alertsOn && styles.alertBtnOn]}
            onPress={() => requireAuth(() => setAlertsOn(!alertsOn))}
          >
            <Ionicons name={alertsOn ? 'notifications' : 'notifications-outline'} size={18} color={alertsOn ? colors.primary : colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.topActions}>
          <Button label="Share" variant="outline" onPress={() => setShareOpen(true)} />
          <Button label={giftOpen ? 'Hide gifts' : 'Send gift'} variant="secondary" onPress={() => requireAuth(() => setGiftOpen(!giftOpen))} />
          <Button label="Report" variant="ghost" onPress={() => setReportOpen(true)} />
        </View>
        {giftOpen ? <LiveGiftPanel onSent={() => setGiftOpen(false)} /> : null}
        <ScrollView
          ref={chatRef}
          style={styles.chat}
          contentContainerStyle={[styles.chatContent, { paddingBottom: spacing.md }]}
          onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((m) => (
            <Text key={m.id} style={styles.chatLine}>
              <Text style={styles.chatUser}>@{m.user}: </Text>
              {m.message}
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
            editable={!!user}
            onSubmitEditing={sendChat}
            returnKeyType="send"
          />
          <Button label="Send" style={styles.sendBtn} onPress={sendChat} disabled={!draft.trim()} />
        </View>
      </View>
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={stream.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
