import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMockAuth } from '@/context/MockAuthContext';
import { useVideoComments } from '@/hooks/api/useVideoComments';
import { radius, spacing, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { formatRelativeTime, formatViewCount } from '@/utils/format-media';

type Props = {
  visible: boolean;
  onClose: () => void;
  videoId?: string;
  count?: number;
  videoTitle?: string;
};

export function CommentsSheet({ visible, onClose, videoId, count, videoTitle }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isAuthenticated, requireAuth, user } = useMockAuth();
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const { data, isLoading, postComment, likeComment } = useVideoComments(visible ? videoId : undefined);
  const comments = data?.items ?? [];
  const total = count ?? data?.meta.total ?? comments.length;
  const countLabel = total > 0 ? formatViewCount(total) : null;

  const submit = () => {
    if (!requireAuth()) return;
    const body = text.trim();
    if (!body || !videoId) return;
    void postComment.mutateAsync({ body, parentId: replyingTo?.id }).then(() => {
      setText('');
      setReplyingTo(null);
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={countLabel ? `Comments (${countLabel})` : 'Comments'}
      height="92%"
      scroll={false}
    >
      <View style={styles.sheetBody}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          {videoTitle ? (
            <Text style={styles.videoTitle} numberOfLines={1}>{videoTitle}</Text>
          ) : null}

          {!videoId ? (
            <Text style={styles.empty}>Comments are not available for this content yet.</Text>
          ) : (
            <>
              <View style={styles.composer}>
                {isAuthenticated ? (
                  <>
                    {replyingTo ? (
                      <View style={styles.replyBar}>
                        <Text style={styles.replyText}>Replying to @{replyingTo.username}</Text>
                        <Pressable onPress={() => setReplyingTo(null)}>
                          <Text style={styles.replyCancel}>Cancel</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    <View style={styles.inputRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarLetter}>
                          {(user?.username ?? 'Y')[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder={replyingTo ? 'Add a reply…' : 'Add a comment…'}
                        placeholderTextColor={colors.mutedForeground}
                        value={text}
                        onChangeText={setText}
                      />
                      <Pressable
                        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                        onPress={submit}
                        disabled={!text.trim() || postComment.isPending}
                      >
                        <Ionicons name="send" size={16} color={colors.primaryForeground} />
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable style={styles.signInRow} onPress={() => requireAuth()}>
                    <View style={styles.avatar} />
                    <Text style={styles.signInText}>Add a comment…</Text>
                  </Pressable>
                )}
              </View>

              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
              ) : (
                <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                  {comments.length === 0 ? (
                    <Text style={styles.empty}>No comments yet. Be the first.</Text>
                  ) : (
                    comments.map((c) => (
                      <View key={c.id}>
                        <View style={styles.comment}>
                          <View style={styles.commentAvatar}>
                            <Text style={styles.commentAvatarLetter}>
                              {c.user.username[0]?.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.commentBody}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.author}>@{c.user.username}</Text>
                              <Text style={styles.time}>{formatRelativeTime(c.createdAt)}</Text>
                            </View>
                            <Text style={styles.body}>{c.body}</Text>
                            <View style={styles.commentActions}>
                              <Pressable
                                style={styles.commentAction}
                                onPress={() => requireAuth(() => void likeComment.mutate(c.id))}
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
                                style={styles.commentAction}
                                onPress={() => requireAuth(() => setReplyingTo({ id: c.id, username: c.user.username }))}
                              >
                                <Text style={styles.actionLabel}>Reply</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                        {(c.replies ?? []).map((reply) => (
                          <View key={reply.id} style={[styles.comment, styles.replyComment]}>
                            <View style={styles.commentAvatar}>
                              <Text style={styles.commentAvatarLetter}>
                                {reply.user.username[0]?.toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.commentBody}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.author}>@{reply.user.username}</Text>
                                <Text style={styles.time}>{formatRelativeTime(reply.createdAt)}</Text>
                              </View>
                              <Text style={styles.body}>{reply.body}</Text>
                              <View style={styles.commentActions}>
                                <Pressable
                                  style={styles.commentAction}
                                  onPress={() => requireAuth(() => void likeComment.mutate(reply.id))}
                                >
                                  <Ionicons
                                    name={reply.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                                    size={16}
                                    color={reply.liked ? colors.primary : colors.mutedForeground}
                                  />
                                  {reply.likesCount > 0 ? (
                                    <Text style={[styles.actionLabel, reply.liked && styles.actionOn]}>
                                      {formatViewCount(reply.likesCount)}
                                    </Text>
                                  ) : null}
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    sheetBody: { flex: 1, padding: 16, paddingBottom: 24 },
    videoTitle: {
      color: colors.mutedForeground,
      fontSize: 13,
      marginBottom: spacing.sm,
      paddingHorizontal: 4,
    },
    empty: { color: colors.mutedForeground, fontSize: 14, marginTop: 16, textAlign: 'center' },
    composer: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md,
      marginBottom: spacing.md,
    },
    signInRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    signInText: { color: colors.mutedForeground, fontSize: 14 },
    replyBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      paddingHorizontal: 4,
    },
    replyText: { color: colors.mutedForeground, fontSize: 12 },
    replyCancel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: withAlpha(colors.primary, 0.2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: { color: colors.primary, fontWeight: '800' },
    input: {
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
    sendBtnDisabled: { opacity: 0.45 },
    listScroll: { flex: 1 },
    comment: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    replyComment: { marginLeft: 28, marginBottom: spacing.md },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarLetter: { color: colors.foreground, fontWeight: '700', fontSize: 13 },
    commentBody: { flex: 1 },
    commentHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    author: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
    time: { color: colors.mutedForeground, fontSize: 12 },
    body: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
    commentActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
    commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionLabel: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
    actionOn: { color: colors.primary },
  });
}
