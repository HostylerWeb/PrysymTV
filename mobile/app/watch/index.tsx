import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { VideoCardTile } from '@/components/feed/VideoCardTile';
import { PageFooter } from '@/components/layout/PageFooter';
import { mockVideos } from '@/mocks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

export default function WatchBrowseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const longForm = mockVideos.filter((v) => v.type === 'video').slice(0, 6);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Watch" showSearch={false} showNotifications={false} />

        <Text style={[styles.hero, { color: colors.foreground }]}>Browse videos</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Long-form videos from creators across sports, finance, cooking, tech, and more.
        </Text>

        <View style={styles.actions}>
          <Button label="Open Videos tab" onPress={() => router.push('/(tabs)/videos')} />
          <Button label="Trending Shorts" variant="secondary" onPress={() => router.push('/(tabs)/shorts')} />
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Popular now</Text>
        {longForm.map((v) => (
          <VideoCardTile key={v.id} video={v} variant="row" />
        ))}

        <PageFooter />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  hero: { ...typography.h1, marginTop: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  section: { ...typography.h2, marginTop: 20, marginBottom: 12 },
});
