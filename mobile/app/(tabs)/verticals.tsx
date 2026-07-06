import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { SectionHeader } from '@/components/home/SectionHeader';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { mockVerticals } from '@/mocks';
import { colors, radius, typography } from '@/theme/tokens';

export default function VerticalsScreen() {
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader
          title="Verticals"
          showCreate
          searchScope="vertical"
          onCreatePress={() => requireAuth(() => trigger('vertical'))}
        />
        <Text style={styles.sub}>Micro-drama series - swipe up episodes</Text>
      </View>
      <FlatList
        data={mockVerticals}
        keyExtractor={(item) => item.slug}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListFooterComponent={<PageFooter />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/verticals/${item.slug}`)}>
            <Image source={{ uri: item.posterUrl ?? '' }} style={styles.poster} contentFit="cover" />
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.meta}>{item.episodeCount} episodes · {item.genre}</Text>
          </Pressable>
        )}
      />
      {flowHost}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  row: { justifyContent: 'space-between', paddingHorizontal: 16 },
  list: { paddingBottom: 100 },
  card: { width: '48%', marginBottom: 20 },
  poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: radius.md, backgroundColor: colors.secondary },
  title: { ...typography.h3, color: colors.foreground, fontSize: 14, marginTop: 8 },
  meta: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
});
