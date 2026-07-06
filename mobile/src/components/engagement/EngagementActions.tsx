import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  liked?: boolean;
  disliked?: boolean;
  saved?: boolean;
  following?: boolean;
  showSubscribe?: boolean;
  showGift?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onSave?: () => void;
  onPlaylist?: () => void;
  showPlaylist?: boolean;
  onShare?: () => void;
  onGift?: () => void;
  onReport?: () => void;
  onSubscribe?: () => void;
};

export function EngagementActions({
  liked,
  disliked,
  saved,
  following,
  showSubscribe = true,
  showGift = true,
  onLike,
  onDislike,
  onSave,
  onPlaylist,
  showPlaylist = true,
  onShare,
  onGift,
  onReport,
  onSubscribe,
}: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Button
        label={liked ? 'Liked' : 'Like'}
        variant={liked ? 'primary' : 'secondary'}
        size="sm"
        onPress={onLike}
        style={styles.btn}
      />
      <Button
        label={disliked ? 'Disliked' : 'Dislike'}
        variant={disliked ? 'primary' : 'outline'}
        size="sm"
        onPress={onDislike}
        style={styles.btn}
      />
      <Button
        label={saved ? 'Saved' : 'Save'}
        variant="outline"
        size="sm"
        onPress={onSave}
        style={styles.btn}
      />
      {showPlaylist && (
        <Button label="Playlist" variant="outline" size="sm" onPress={onPlaylist} style={styles.btn} />
      )}
      {showSubscribe && (
        <Button
          label={following ? 'Subscribed' : 'Subscribe'}
          variant={following ? 'secondary' : 'outline'}
          size="sm"
          onPress={onSubscribe}
          style={styles.btn}
        />
      )}
      {showGift && (
        <Button label="Gift" variant="outline" size="sm" onPress={onGift} style={styles.btn} />
      )}
      <Button label="Share" variant="ghost" size="sm" onPress={onShare} style={styles.btn} />
      <Button label="Report" variant="ghost" size="sm" onPress={onReport} style={styles.btn} />
    </ScrollView>
  );
}

export function EngagementIconRow({
  items,
}: {
  items: { icon: string; label: string; onPress?: () => void; active?: boolean }[];
}) {
  return (
    <View style={styles.iconRow}>
      {items.map((item) => (
        <Pressable key={item.label} style={styles.iconItem} onPress={item.onPress}>
          <ThemedText variant="caption" primary={item.active}>
            {item.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
  },
  btn: { minWidth: 88 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
});
