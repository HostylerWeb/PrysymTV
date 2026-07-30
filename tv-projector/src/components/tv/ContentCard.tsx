import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Props = {
  title: string;
  thumbnailUrl?: string | null;
  subtitle?: string;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  aspectRatio?: number;
};

export function ContentCard({
  title,
  thumbnailUrl,
  subtitle,
  onPress,
  hasTVPreferredFocus,
  aspectRatio = 16 / 9,
}: Props) {
  return (
    <Pressable
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      style={({ focused }) => [styles.card, focused && styles.cardFocused]}
    >
      <View style={styles.posterWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={[styles.poster, { aspectRatio }]} resizeMode="cover" />
        ) : (
          <View style={[styles.poster, styles.posterFallback, { aspectRatio }]} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    marginRight: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 8,
  },
  cardFocused: {
    borderColor: colors.focus,
    backgroundColor: colors.secondary,
    transform: [{ scale: 1.05 }],
  },
  posterWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  poster: {
    width: '100%',
  },
  posterFallback: {
    backgroundColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 10,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
});
