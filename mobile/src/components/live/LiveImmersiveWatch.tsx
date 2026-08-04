import React, { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LiveBroadcastPlayer } from '@/components/live/LiveBroadcastPlayer';
import { LiveGiftPanel } from '@/components/live/LiveGiftPanel';
import { Button } from '@/components/ui/Button';
import type { StreamChatMessage } from '@/lib/api/stream-chat';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  streamer: string;
  viewerCount: number;
  isPaid?: boolean;
  webrtcUrl?: string | null;
  hlsUrl?: string | null;
  posterUrl?: string | null;
  paused: boolean;
  creatorId: string;
  streamId: string;
  messages: StreamChatMessage[];
  connected: boolean;
  chatError: string | null;
  draft: string;
  onDraftChange: (text: string) => void;
  onSendChat: () => void;
  canChat: boolean;
  giftOpen: boolean;
  onToggleGift: () => void;
  onGiftSent: () => void;
  onOpenShare: () => void;
};

export function LiveImmersiveWatch({
  visible,
  onClose,
  title,
  streamer,
  viewerCount,
  isPaid,
  webrtcUrl,
  hlsUrl,
  posterUrl,
  paused,
  creatorId,
  streamId,
  messages,
  connected,
  chatError,
  draft,
  onDraftChange,
  onSendChat,
  canChat,
  giftOpen,
  onToggleGift,
  onGiftSent,
  onOpenShare,
}: Props) {
  const insets = useSafeAreaInsets();
  const chatRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => chatRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearTimeout(timer);
  }, [visible, messages.length]);

  return (
    <Modal visible={visible} animationType="fade" supportedOrientations={['portrait', 'landscape']} onRequestClose={onClose}>
      <StatusBar hidden={visible} />
      <View style={styles.root}>
        <LiveBroadcastPlayer
          webrtcUrl={webrtcUrl}
          hlsUrl={hlsUrl}
          posterUrl={posterUrl}
          contentFit="cover"
          paused={paused}
          isLive
          autoPlay
          immersive
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'transparent']}
          style={[styles.topGradient, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.topRow}>
            <Pressable style={styles.iconBtn} onPress={onClose} accessibilityLabel="Exit fullscreen">
              <Ionicons name="chevron-down" size={22} color={colors.onVideo} />
            </Pressable>
            <View style={styles.topMeta}>
              <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.topSub} numberOfLines={1}>
                {streamer} · {viewerCount.toLocaleString()} watching
              </Text>
            </View>
            <View style={styles.topActions}>
              <Pressable style={styles.iconBtn} onPress={onOpenShare} accessibilityLabel="Share">
                <Ionicons name="share-outline" size={20} color={colors.onVideo} />
              </Pressable>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>{isPaid ? 'VIP' : 'LIVE'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.bottomStack}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.85)']}
            style={styles.bottomGradient}
            pointerEvents="box-none"
          >
            {!giftOpen ? (
              <ScrollView
                ref={chatRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.slice(-40).map((m) => (
                  <Text key={m.id} style={styles.chatLine} numberOfLines={3}>
                    <Text style={styles.chatUser}>@{m.user}: </Text>
                    {m.type === 'gift' ? `🎁 ${m.message}` : m.message}
                  </Text>
                ))}
              </ScrollView>
            ) : null}

            {chatError ? <Text style={styles.chatError}>{chatError}</Text> : null}

            {giftOpen ? (
              <View style={[styles.giftSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <LiveGiftPanel receiverId={creatorId} streamId={streamId} onSent={onGiftSent} />
              </View>
            ) : (
              <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Pressable style={styles.giftBtn} onPress={onToggleGift} accessibilityLabel="Send gift">
                  <Ionicons name="gift-outline" size={22} color={colors.onVideo} />
                </Pressable>
                <TextInput
                  placeholder={canChat ? 'Say something…' : 'Sign in to chat'}
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.input}
                  value={draft}
                  onChangeText={onDraftChange}
                  editable={canChat && connected}
                  onSubmitEditing={onSendChat}
                  returnKeyType="send"
                />
                <Button
                  label="Send"
                  size="sm"
                  style={styles.sendBtn}
                  onPress={onSendChat}
                  disabled={!draft.trim() || !connected || !canChat}
                />
              </View>
            )}
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: spacing.page,
    paddingBottom: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topMeta: { flex: 1, minWidth: 0 },
  topTitle: { color: colors.onVideo, fontSize: 15, fontWeight: '800' },
  topSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePill: {
    backgroundColor: colors.live,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  livePillText: { color: colors.onVideo, fontSize: 10, fontWeight: '800' },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    maxHeight: '52%',
  },
  bottomGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.page,
    paddingTop: 24,
  },
  chatScroll: { maxHeight: 180, marginBottom: 8 },
  chatContent: { gap: 6, paddingBottom: 4 },
  chatLine: { color: colors.onVideo, fontSize: 13, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  chatUser: { color: '#93c5fd', fontWeight: '700' },
  chatError: { color: '#fca5a5', fontSize: 12, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  giftBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.onVideo,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendBtn: { paddingHorizontal: 12 },
  giftSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 8,
    maxHeight: 360,
  },
});
