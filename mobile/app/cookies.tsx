import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors } from '@/theme/tokens';

const SECTIONS = [
  { title: 'What we use cookies for', body: 'Authentication, preferences, analytics, and ad delivery on Prysym TV.' },
  { title: 'Essential cookies', body: 'Required for sign-in, security, and core playback features.' },
  { title: 'Analytics', body: 'Help us understand how viewers discover and watch content.' },
  { title: 'Advertising', body: 'Used to measure campaign performance for advertisers.' },
  { title: 'Your choices', body: 'You can manage non-essential cookies in device settings. Full policy mirrors app/cookies/page.tsx.' },
];

export default function CookiesScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <AppHeader showBack title="Cookie Policy" showSearch={false} showNotifications={false} />
      {SECTIONS.map((s) => (
        <View key={s.title}>
          <Text style={styles.heading}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  heading: { color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  body: { color: colors.mutedForeground, fontSize: 14, lineHeight: 22 },
});
