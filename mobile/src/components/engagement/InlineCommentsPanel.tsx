import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockComments } from '@/mocks';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  count?: number;
  expanded?: boolean;
  onToggle?: () => void;
};

export function InlineCommentsPanel({ count, expanded = true, onToggle }: Props) {
  const { isAuthenticated, requireAuth } = useMockAuth();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [text, setText] = useState('');
  const [comments, setComments] = useState(mockComments);

  const submit = () => {
    if (!requireAuth()) return;
    const body = text.trim();
    if (!body) return;
    setComments((prev) => [
      { id: `new-${Date.now()}`, author: 'you', body, likes: 0, liked: false },
      ...prev,
    ]);
    setText('');
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={onToggle}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.foreground} />
        <Text style={styles.headerTitle}>Comments ({count ?? comments.length})</Text>
        {onToggle ? (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        ) : null}
      </Pressable>

      {expanded ? (
        <>
          {!isAuthenticated ? (
            <Pressable style={styles.guestBanner} onPress={() => requireAuth()}>
              <Text style={styles.guestText}>Sign in to comment and like replies</Text>
            </Pressable>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder={isAuthenticated ? 'Add a comment...' : 'Sign in to comment...'}
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              editable={isAuthenticated}
              onFocus={() => { if (!isAuthenticated) requireAuth(); }}
            />
            <Pressable style={[styles.send, !text.trim() && styles.sendOff]} onPress={submit} disabled={!text.trim()}>
              <Ionicons name="send" size={16} color={colors.primaryForeground} />
            </Pressable>
          </View>

          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.avatar}><Text style={styles.avatarLetter}>{c.author[0]?.toUpperCase()}</Text></View>
              <View style={styles.body}>
                <Text style={styles.author}>@{c.author} · 2h ago</Text>
                <Text style={styles.text}>{c.body}</Text>
                <Pressable
                  style={styles.likeRow}
                  onPress={() => requireAuth(() => setLiked((p) => ({ ...p, [c.id]: !p[c.id] })))}
                >
                  <Ionicons
                    name={liked[c.id] || c.liked ? 'heart' : 'heart-outline'}
                    size={14}
                    color={liked[c.id] || c.liked ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={styles.likeCount}>{c.likes + (liked[c.id] ? 1 : 0)}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.page,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  headerTitle: { flex: 1, color: colors.foreground, fontWeight: '700', fontSize: 15 },
  guestBanner: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '12',
    marginBottom: spacing.sm,
  },
  guestText: { color: colors.primary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.foreground, fontWeight: '700', fontSize: 12 },
  body: { flex: 1 },
  author: { color: colors.mutedForeground, fontSize: 11, marginBottom: 4 },
  text: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  likeCount: { color: colors.mutedForeground, fontSize: 12 },
});
