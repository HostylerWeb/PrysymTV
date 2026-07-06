import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MockServedAd } from '@/components/ads/mock-ad-data';
import { MOCK_MOVIE_PREROLL_AD } from '@/components/ads/mock-ad-data';
import { colors, radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  ad?: MockServedAd;
  onComplete: () => void;
};

export function AdPreroll({ visible, ad = MOCK_MOVIE_PREROLL_AD, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(ad.skipAfterSeconds);
  const [ready, setReady] = useState(false);
  const canSkip = ready && countdown <= 0;

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
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => canSkip && onComplete()}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.player}>
          <Image
            source={{ uri: ad.mediaUrl }}
            style={styles.media}
            contentFit="contain"
            onLoad={() => setReady(true)}
          />
          {ready && canSkip ? (
            <Pressable style={styles.skipBtn} onPress={onComplete}>
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          ) : ready ? (
            <View style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip in {countdown}s</Text>
            </View>
          ) : null}
          {ready && ad.title ? (
            <Pressable style={styles.adLink} onPress={() => void Linking.openURL(ad.clickThroughUrl)}>
              <Text style={styles.adLinkText}>{ad.title}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  player: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  skipBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  skipText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  adLink: { position: 'absolute', bottom: 12, left: 12 },
  adLinkText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textDecorationLine: 'underline' },
});
