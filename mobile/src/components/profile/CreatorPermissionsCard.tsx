import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius } from '@/theme/tokens';
import {
  getCreatorCapabilities,
  hasLockedCapabilities,
  type CreatorCapabilityId,
} from '@/utils/creator-capabilities';
import type { MeResponse } from '@/types/api';

const ICONS: Record<CreatorCapabilityId, keyof typeof Ionicons.glyphMap> = {
  shorts: 'flash-outline',
  videos: 'play-circle-outline',
  podcasts: 'headset-outline',
  verticals: 'grid-outline',
  live: 'radio-outline',
  store: 'bag-outline',
};

type Props = {
  user: MeResponse | null;
  onUnlock: () => void;
  onApplyLive?: () => void;
  onApplyVertical?: () => void;
};

export function CreatorPermissionsCard({ user, onUnlock, onApplyLive, onApplyVertical }: Props) {
  if (!user) return null;
  const caps = getCreatorCapabilities(user);
  const readyCount = caps.filter((c) => c.allowed).length;

  const handleTilePress = (id: CreatorCapabilityId, state: string) => {
    if (state === 'ready') return;
    if (id === 'live' && onApplyLive) onApplyLive();
    else if (id === 'verticals' && onApplyVertical) onApplyVertical();
    else onUnlock();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Creator access</Text>
      <Text style={styles.sub}>
        {readyCount}/{caps.length} formats · tap locked tile to apply
      </Text>
      <View style={styles.grid}>
        {caps.map((cap) => {
          const state = cap.allowed ? 'ready' : cap.pending ? 'pending' : 'locked';
          return (
            <Pressable
              key={cap.id}
              style={[
                styles.tile,
                state === 'ready' && styles.ready,
                state === 'pending' && styles.pending,
              ]}
              onPress={() => handleTilePress(cap.id, state)}
            >
              <Ionicons
                name={ICONS[cap.id]}
                size={16}
                color={
                  state === 'ready'
                    ? colors.success
                    : state === 'pending'
                      ? colors.warning
                      : colors.mutedForeground
                }
              />
              <Text style={styles.tileLabel}>{cap.label}</Text>
              {state === 'locked' && <Text style={styles.tapHint}>Tap</Text>}
            </Pressable>
          );
        })}
      </View>
      {hasLockedCapabilities(user) && (
        <Button label="Unlock more features" onPress={onUnlock} style={{ marginTop: 12 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 16,
  },
  title: { color: colors.foreground, fontSize: 13, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 11, marginTop: 4, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    gap: 4,
  },
  ready: { borderColor: colors.success + '44', backgroundColor: colors.success + '11' },
  pending: { borderColor: colors.warning + '44', backgroundColor: colors.warning + '11' },
  tileLabel: { color: colors.foreground, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  tapHint: { color: colors.primary, fontSize: 8, fontWeight: '700' },
});
