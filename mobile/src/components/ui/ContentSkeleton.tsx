import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme/tokens';

function Bone({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.bone, style, { opacity }]} />;
}

export function HeroSkeleton() {
  return (
    <View style={styles.hero}>
      <Bone style={{ width: 100, height: 14, marginBottom: 12 }} />
      <Bone style={{ width: '75%', height: 28, marginBottom: 8 }} />
      <Bone style={{ width: '50%', height: 14, marginBottom: 16 }} />
      <Bone style={{ width: 120, height: 40, borderRadius: radius.full }} />
    </View>
  );
}

export function RowSkeleton({ count = 4, itemWidth = 160, itemHeight = 90 }: { count?: number; itemWidth?: number; itemHeight?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={i} style={{ width: itemWidth, height: itemHeight, borderRadius: radius.lg }} />
      ))}
    </View>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={i} style={styles.gridItem} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: { backgroundColor: colors.secondary, borderRadius: radius.md },
  hero: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  grid: { paddingHorizontal: 16, gap: 12 },
  gridItem: { height: 88, borderRadius: radius.lg },
});
