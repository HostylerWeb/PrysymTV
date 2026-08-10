import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '@/theme/tokens';

type Props = {
  title: string;
  thumbnailUrl?: string | null;
  subtitle?: string;
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  aspectRatio?: number;
  layout?: 'row' | 'grid';
  onBeforeNavigate?: () => void;
};

export function ContentCard({
  title,
  thumbnailUrl,
  subtitle,
  onPress,
  hasTVPreferredFocus,
  aspectRatio = 16 / 9,
  layout = 'row',
  onBeforeNavigate,
}: Props) {
  const handlePress = () => {
    onBeforeNavigate?.();
    onPress?.();
  };

  return (
    <Pressable
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={handlePress}
      style={({ focused }) => [
        styles.card,
        layout === 'grid' ? styles.cardGrid : styles.cardRow,
        focused && styles.cardFocused,
      ]}
    >
      <View style={styles.posterWrap}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={[styles.poster, { aspectRatio }]}
            contentFit="cover"
            recyclingKey={thumbnailUrl}
          />
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
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 8,
  },
  cardRow: {
    width: 260,
    marginRight: 20,
  },
  cardGrid: {
    width: 260,
    marginRight: 0,
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
