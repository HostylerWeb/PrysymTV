import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
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
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Pill styles={styles} active={liked} onPress={onLike} icon={liked ? 'thumbs-up' : 'thumbs-up-outline'} label={formatViewCount(likesCount)} />
      <Pill styles={styles} active={disliked} onPress={onDislike} icon={disliked ? 'thumbs-down' : 'thumbs-down-outline'} />
      {showGift && <Pill styles={styles} onPress={onGift} icon="gift-outline" label="Gift" />}
      <Pill styles={styles} onPress={onShare} icon="share-outline" label="Share" />
      <Pill styles={styles} active={saved} onPress={onSave} icon={saved ? 'bookmark' : 'bookmark-outline'} label="Save" />
      {showPlaylist && <Pill styles={styles} onPress={onPlaylist} icon="list-outline" label="Playlist" />}
    </View>
  );
}

type PillStyles = ReturnType<typeof createStyles>;

function Pill({
  icon,
  label,
  active,
  onPress,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  active?: boolean;
  onPress?: () => void;
  styles: PillStyles;
}) {
  const { colors } = useTheme();

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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
