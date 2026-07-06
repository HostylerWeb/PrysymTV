import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MockServedAd } from '@/components/ads/mock-ad-data';
import { MOCK_VERTICAL_AD } from '@/components/ads/mock-ad-data';
import { colors, radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  ad?: MockServedAd;
  onComplete: () => void;
};

export function VerticalEpisodeAdGate({ visible, ad = MOCK_VERTICAL_AD, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(ad.skipAfterSeconds);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCountdown(ad.skipAfterSeconds);
    setReady(false);
  }, [visible, ad.skipAfterSeconds]);

  useEffect(() => {
    if (!visible || !ready || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ready, countdown]);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => countdown <= 0 && onComplete()}>
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => void Linking.openURL(ad.clickThroughUrl)}>
            <Text style={styles.sponsor} numberOfLines={1}>Sponsored · {ad.title}</Text>
          </Pressable>
          {ready && countdown <= 0 ? (
            <Pressable style={styles.continueBtn} onPress={onComplete}>
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          ) : ready ? (
            <Text style={styles.countdown}>Continue in {countdown}s</Text>
          ) : (
            <Text style={styles.countdown}>Loading…</Text>
          )}
        </View>
        <Image source={{ uri: ad.mediaUrl }} style={styles.media} contentFit="cover" onLoad={() => setReady(true)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  sponsor: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecorationLine: 'underline' },
  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  continueText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  countdown: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  media: { flex: 1, width: '100%' },
});
