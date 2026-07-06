import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToPlaylistSheet } from '@/components/modals/AddToPlaylistSheet';
import { GiftModal } from '@/components/modals/GiftModal';
import { CommentsSheet } from '@/components/modals/CommentsSheet';
import { ShareModal } from '@/components/modals/ShareModal';
import { ReportModal } from '@/components/modals/ReportModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { getMockVideo } from '@/mocks';
import { colors, withAlpha } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

const { height } = Dimensions.get('window');

export default function ShortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAuth } = useMockAuth();
  const short = getMockVideo(id ?? '') ?? getMockVideo('short-1')!;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [liked, setLiked] = useState(!!short.liked);
  const [following, setFollowing] = useState(!!short.isFollowing);

  return (
    <>
      <View style={[styles.screen, { height: height - insets.bottom }]}>
        <Image source={{ uri: short.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.overlay} />
        <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.onVideo} />
        </Pressable>
        <View style={[styles.sideActions, { bottom: 140 }]}>
          <Action
            icon={liked ? 'heart' : 'heart-outline'}
            label={formatViewCount(short.likesCount ?? 0)}
            onPress={() => requireAuth(() => setLiked(!liked))}
          />
          <Action icon="chatbubble-outline" label="Comments" onPress={() => requireAuth(() => setCommentsOpen(true))} />
          <Action icon="gift-outline" label="Gift" onPress={() => requireAuth(() => setGiftOpen(true))} />
          <Action icon="bookmark-outline" label="Save" onPress={() => requireAuth(() => setPlaylistOpen(true))} />
          <Action icon="share-outline" label="Share" onPress={() => setShareOpen(true)} />
          <Action icon="flag-outline" label="Report" onPress={() => requireAuth(() => setReportOpen(true))} />
        </View>
        <View style={[styles.bottomMeta, { paddingBottom: 24 + insets.bottom }]}>
          <Pressable onPress={() => router.push(`/creator/${short.channelSlug}`)}>
            <Text style={styles.channel}>@{short.channelSlug}</Text>
          </Pressable>
          <Text style={styles.caption}>{short.title}</Text>
          <Pressable
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={() => requireAuth(() => setFollowing(!following))}
          >
            <Text style={styles.followText}>{following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>
      </View>
      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
      <ShareModal visible={shareOpen} onClose={() => setShareOpen(false)} title={short.title} />
      <GiftModal visible={giftOpen} onClose={() => setGiftOpen(false)} />
      <AddToPlaylistSheet visible={playlistOpen} onClose={() => setPlaylistOpen(false)} contentTitle={short.title} />
      <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Ionicons name={icon} size={28} color={colors.onVideo} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.videoBackground, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrimLight },
  back: { position: 'absolute', left: 12, padding: 8 },
  sideActions: { position: 'absolute', right: 12, alignItems: 'center', gap: 20 },
  action: { alignItems: 'center', gap: 4 },
  actionLabel: { color: colors.onVideo, fontSize: 11, fontWeight: '600' },
  bottomMeta: { paddingHorizontal: 16, paddingRight: 72 },
  channel: { color: colors.onVideo, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  caption: { color: colors.onVideo, fontSize: 14, marginBottom: 8 },
  followBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  followingBtn: { backgroundColor: withAlpha(colors.onVideo, 0.2) },
  followText: { color: colors.onVideo, fontSize: 13, fontWeight: '700' },
});
