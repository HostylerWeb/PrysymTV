import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, withAlpha } from '@/theme/tokens';

type Props = {
  variant?: 'default' | 'on-video' | 'compact';
  label?: string;
};

/** Cast current media to TV — Chromecast SDK wiring in a later phase. */
export function CastMediaButton({ variant = 'default', label = 'Cast to TV' }: Props) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={() =>
        Alert.alert(
          label,
          'Cast will send the current video or audio to your TV. Full Chromecast support is coming soon.',
        )
      }
      style={[
        styles.base,
        variant === 'on-video' && styles.onVideo,
        variant === 'compact' && styles.compact,
        variant === 'default' && styles.default,
      ]}
    >
      <Ionicons
        name="tv-outline"
        size={variant === 'compact' ? 16 : 20}
        color={variant === 'on-video' ? colors.onVideo : colors.foreground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  onVideo: {
    width: 40,
    height: 40,
    backgroundColor: withAlpha(colors.onVideo, 0.15),
  },
  compact: {
    width: 32,
    height: 32,
  },
  default: {
    width: 40,
    height: 40,
    backgroundColor: colors.secondary,
  },
});
