import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVideoComments } from '@/hooks/api/useVideoComments';
import { radius, spacing, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatRelativeTime, formatViewCount } from '@/utils/format-media';

type Props = {
  videoId: string;
  count?: number;
  videoTitle?: string;
  thumbnailUrl?: string | null;
};

export function WatchCommentsPanel({ videoId, count, videoTitle, thumbnailUrl }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, requireAuth, user } = useMockAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data, isLoading, postComment, likeComment } = useVideoComments(videoId);
  const comments = data?.items ?? [];
  const total = count ?? data?.meta.total ?? comments.length;
  const topComment = comments[0];

  const countLabel = total > 0 ? formatViewCount(total) : null;

  const submit = () => {
    if (!requireAuth()) return;
    const body = text.trim();
    if (!body) return;
    postComment.mutate(
      { body, parentId: replyingTo ?? undefined },
      {
        onSuccess: () => {
          setText('');
          setReplyingTo(null);
        },
      },
    );
  };

  return (
    <>
      {!open && (
        <Pressable style={styles.preview} onPress={() => setOpen(true)}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Comments</Text>
            <View style={styles.previewRight}>
              {countLabel ? <Text style={styles.previewCount}>{countLabel}</Text> : null}
              <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
            </View>
          </View>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : topComment ? (
            <View style={styles.previewRow}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarLetter}>
                  {topComment.user.username[0]?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.previewSnippet} numberOfLines={2}>
                <Text style={styles.previewAuthor}>@{topComment.user.username}</Text>
                <Text style={styles.previewBody}> {topComment.body}</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.previewEmpty}>Add a comment…</Text>
          )}
        </Pressable>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          {thumbnailUrl ? (
            <View style={[styles.miniPlayer, { paddingTop: insets.top }]}>
              <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.miniOverlay}>
                <Ionicons name="play-circle" size={48} color={withAlpha(colors.onVideo, 0.9)} />
                {videoTitle ? (
                  <Text style={styles.miniTitle} numberOfLines={1}>{videoTitle}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={[styles.sheet, thumbnailUrl ? styles.sheetBelowMini : null]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <View style={styles.sheetHeaderRight}>
                {countLabel ? <Text style={styles.sheetCount}>{countLabel}</Text> : null}
                <Pressable onPress={() => setOpen(false)} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <View style={styles.addCommentRow}>
              {isAuthenticated ? (
                <>
                  {replyingTo ? (
                    <View style={styles.replyBar}>
                      <Text style={styles.replyText}>Replying to @{replyingTo}</Text>
                      <Pressable onPress={() => setReplyingTo(null)}>
                        <Text style={styles.replyCancel}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  <View style={styles.composerRow}>
                    <View style={styles.composerAvatar}>
                      <Text style={styles.composerAvatarLetter}>
                        {(user?.username ?? 'Y')[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.composerInput}
                      placeholder={replyingTo ? 'Add a reply…' : 'Add a comment…'}
                      placeholderTextColor={colors.mutedForeground}
                      value={text}
                      onChangeText={setText}
                    />
                    <Pressable
                      style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
                      onPress={submit}
                      disabled={!text.trim() || postComment.isPending}
                    >
                      <Ionicons name="send" size={16} color={colors.primaryForeground} />
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable style={styles.signInRow} onPress={() => requireAuth()}>
                  <View style={styles.composerAvatar} />
                  <Text style={styles.signInText}>Add a comment…</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
              ) : comments.length === 0 ? (
                <Text style={styles.previewEmpty}>No comments yet. Be the first!</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.comment}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarLetter}>
                        {c.user.username[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>@{c.user.username}</Text>
                        <Text style={styles.commentTime}>
                          {formatRelativeTime(c.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.body}</Text>
                      <View style={styles.commentActions}>
                        <Pressable
                          style={styles.actionBtn}
                          onPress={() =>
                            requireAuth(() => likeComment.mutate(c.id))
                          }
                        >
                          <Ionicons
                            name={c.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                            size={16}
                            color={c.liked ? colors.primary : colors.mutedForeground}
                          />
                          {c.likesCount > 0 ? (
                            <Text style={[styles.actionLabel, c.liked && styles.actionOn]}>
                              {formatViewCount(c.likesCount)}
                            </Text>
                          ) : null}
                        </Pressable>
                        <Pressable
                          style={styles.actionBtn}
                          onPress={() => requireAuth(() => setReplyingTo(c.user.username))}
                        >
                          <Text style={styles.actionLabel}>Reply</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const MINI_HEIGHT = 220;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    preview: {
      marginHorizontal: spacing.page,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    previewTitle: { color: colors.foreground, fontSize: 16, fontWeight: '700' },
    previewRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previewCount: { color: colors.mutedForeground, fontSize: 14 },
    previewRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    previewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewAvatarLetter: { color: colors.foreground, fontWeight: '700' },
    previewSnippet: { flex: 1, fontSize: 14, lineHeight: 20 },
    previewAuthor: { fontWeight: '700', color: colors.foreground },
    previewBody: { color: colors.mutedForeground },
    previewEmpty: { color: colors.mutedForeground, fontSize: 14 },
    modalRoot: { flex: 1, backgroundColor: colors.background },
    miniPlayer: {
      height: MINI_HEIGHT,
      backgroundColor: colors.videoBackground,
      zIndex: 2,
    },
    miniOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha('#000', 0.35),
      gap: 8,
      paddingHorizontal: 16,
    },
    miniTitle: { color: colors.onVideo, fontSize: 13, fontWeight: '600', maxWidth: '90%' },
    sheet: { flex: 1, backgroundColor: colors.background },
    sheetBelowMini: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      marginTop: -12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
    sheetHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetCount: { color: colors.mutedForeground, fontSize: 14 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCommentRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    signInRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    signInText: { color: colors.mutedForeground, fontSize: 14 },
    replyBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    replyText: { color: colors.mutedForeground, fontSize: 12 },
    replyCancel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    composerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    composerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: withAlpha(colors.primary, 0.2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerAvatarLetter: { color: colors.primary, fontWeight: '800' },
    composerInput: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      color: colors.foreground,
      fontSize: 14,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnOff: { opacity: 0.4 },
    list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    comment: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarLetter: { color: colors.foreground, fontWeight: '700' },
    commentBody: { flex: 1 },
    commentMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    commentAuthor: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
    commentTime: { color: colors.mutedForeground, fontSize: 12 },
    commentText: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
    commentActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionLabel: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
    actionOn: { color: colors.primary },
  });
}
