import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CoinsModal } from '@/components/modals/CoinsModal';
import { colors, typography } from '@/theme/tokens';

const PERKS = [
  'Ad-free on Shorts, Verticals, and Movies',
  'Skip movie preroll ads',
  'Exclusive member badge on profile',
  'Early access to select premieres',
];

const COIN_PACKS = [
  { coins: 500, price: '$4.99' },
  { coins: 1200, price: '$9.99' },
  { coins: 3000, price: '$19.99' },
];

const CREATORS = ['democreator', 'prysym', 'pixelhost'];

export default function PremiumScreen() {
  const router = useRouter();
  const [coinsOpen, setCoinsOpen] = useState(false);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Premium" showSearch={false} showNotifications={false} />
          <Card style={styles.hero}>
            <Text style={styles.badge}>Prysym Membership</Text>
            <Text style={styles.price}>$4.99<Text style={styles.per}>/month</Text></Text>
            {PERKS.map((p) => (
              <Text key={p} style={styles.perk}>✓ {p}</Text>
            ))}
            <Button label="Subscribe (mock)" style={{ marginTop: 16 }} />
          </Card>

          <Text style={styles.section}>Channel memberships</Text>
          <Card>
            <Text style={styles.cardTitle}>Support creators monthly</Text>
            <Text style={styles.cardSub}>Mock - POST /billing/subscriptions/create in Phase C</Text>
            {CREATORS.map((c) => (
              <Button key={c} label={`@${c}`} variant="outline" style={{ marginTop: 8 }} onPress={() => router.push(`/creator/${c}`)} />
            ))}
          </Card>

          <Text style={styles.section}>Coins</Text>
          <Text style={styles.sub}>Send gifts during live streams.</Text>
          {COIN_PACKS.map((p) => (
            <Card key={p.coins} style={styles.pack}>
              <Text style={styles.packCoins}>🪙 {p.coins.toLocaleString()}</Text>
              <Text style={styles.packPrice}>{p.price}</Text>
              <Button label="Buy" variant="secondary" onPress={() => setCoinsOpen(true)} />
            </Card>
          ))}
        </View>
      </ScrollView>
      <CoinsModal visible={coinsOpen} onClose={() => setCoinsOpen(false)} balance={1250} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  hero: { marginBottom: 8 },
  badge: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  price: { color: colors.foreground, fontSize: 36, fontWeight: '900', marginVertical: 12 },
  per: { fontSize: 16, fontWeight: '400', color: colors.mutedForeground },
  perk: { color: colors.foreground, fontSize: 14, marginTop: 8 },
  section: { ...typography.h2, color: colors.foreground, marginTop: 24, marginBottom: 8 },
  sub: { color: colors.mutedForeground, marginBottom: 12 },
  cardTitle: { color: colors.foreground, fontWeight: '700' },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  pack: { marginBottom: 10, gap: 8 },
  packCoins: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  packPrice: { color: colors.primary, fontWeight: '600' },
});
