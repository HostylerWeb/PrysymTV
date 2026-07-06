import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors } from '@/theme/tokens';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen}>
      <AppHeader showBack title="Privacy" showSearch={false} showNotifications={false} />
      <Text style={styles.body}>Privacy Policy - placeholder. Copy from app/privacy/page.tsx for production UI.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  body: { color: colors.mutedForeground, fontSize: 14, lineHeight: 22, paddingVertical: 16 },
});
