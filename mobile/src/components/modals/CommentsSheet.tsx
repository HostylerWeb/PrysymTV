import React, { useState } from 'react';
import {
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
import { mockComments } from '@/mocks';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

type Props = {
  visible: boolean;
  onClose: () => void;
  count?: number;
  videoTitle?: string;
};

export function CommentsSheet({ visible, onClose, count, videoTitle }: Props) {
  const { isAuthenticated, requireAuth, user } = useMockAuth();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [comments, setComments] = useState(mockComments);
  const total = count ?? comments.length;
  const countLabel = total > 0 ? formatViewCount(total) : null;

  const submit = () => {
    if (!requireAuth()) return;
    const body = text.trim();
    if (!body) return;
    setComments((prev) => [
      {
        id: `new-${Date.now()}`,
        author: user?.username ?? 'you',
        body,
        likes: 0,
        liked: false,
      },
      ...prev,
    ]);
    setText('');
    setReplyingTo(null);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {videoTitle ? (
          <Text style={styles.videoTitle} numberOfLines={1}>{videoTitle}</Text>
        ) : null}

        <View style={styles.composer}>
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
                  disabled={!text.trim()}
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

        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarLetter}>{c.author[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.author}>@{c.author}</Text>
                  <Text style={styles.time}>2w ago</Text>
                </View>
                <Text style={styles.body}>{c.body}</Text>
                <View style={styles.commentActions}>
                  <Pressable
                    style={styles.commentAction}
                    onPress={() => requireAuth(() => setLiked((p) => ({ ...p, [c.id]: !p[c.id] })))}
                  >
                    <Ionicons
                      name={liked[c.id] || c.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={16}
                      color={liked[c.id] || c.liked ? colors.primary : colors.mutedForeground}
                    />
                    {(c.likes > 0 || liked[c.id]) && (
                      <Text style={[styles.actionLabel, (liked[c.id] || c.liked) && styles.actionOn]}>
                        {formatViewCount(c.likes + (liked[c.id] ? 1 : 0))}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.commentAction}
                    onPress={() => requireAuth(() => setReplyingTo(c.author))}
                  >
                    <Text style={styles.actionLabel}>Reply</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheetBody: { flex: 1, padding: 16, paddingBottom: 24 },
  videoTitle: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
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
