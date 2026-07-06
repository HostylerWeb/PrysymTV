import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

type Props = {
  liked?: boolean;
  disliked?: boolean;
  saved?: boolean;
  likesCount?: number;
  showGift?: boolean;
  showPlaylist?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onSave?: () => void;
  onPlaylist?: () => void;
  onGift?: () => void;
  onShare?: () => void;
};

export function WatchEngagementRow({
  liked,
  disliked,
  saved,
  likesCount = 0,
  showGift = true,
  showPlaylist = true,
  onLike,
  onDislike,
  onSave,
  onPlaylist,
  onGift,
  onShare,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Pill active={liked} onPress={onLike} icon={liked ? 'thumbs-up' : 'thumbs-up-outline'} label={formatViewCount(likesCount)} />
      <Pill active={disliked} onPress={onDislike} icon={disliked ? 'thumbs-down' : 'thumbs-down-outline'} />
      {showGift && <Pill onPress={onGift} icon="gift-outline" label="Gift" />}
      <Pill onPress={onShare} icon="share-outline" label="Share" />
      <Pill active={saved} onPress={onSave} icon={saved ? 'bookmark' : 'bookmark-outline'} label="Save" />
      {showPlaylist && <Pill onPress={onPlaylist} icon="list-outline" label="Playlist" />}
    </View>
  );
}

function Pill({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primaryForeground : colors.foreground} />
      {label ? (
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.primaryForeground,
  },
});
