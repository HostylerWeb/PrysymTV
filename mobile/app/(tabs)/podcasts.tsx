import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FilterChip } from '@/components/ui/FilterChip';
import { Button } from '@/components/ui/Button';
import { PodcastMiniPlayer } from '@/components/podcasts/PodcastMiniPlayer';
import { usePodcastPlayer } from '@/context/PodcastPlayerContext';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { mockPodcastEpisodes, mockPodcastShows } from '@/mocks';
import type { PodcastShow } from '@/types/api';
import { colors, radius, typography, withAlpha } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

const CATEGORIES = ['All', 'Business', 'Education', 'Lifestyle', 'Sports'] as const;

function ShowRail({ title, shows, onShowPress }: { title: string; shows: PodcastShow[]; onShowPress: (show: PodcastShow) => void }) {
  return (
    <View style={styles.railWrap}>
      <SectionHeader title={title} />
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {shows.map((show) => (
          <Pressable key={show.id} style={styles.showCard} onPress={() => onShowPress(show)}>
            <Image source={{ uri: show.coverUrl ?? '' }} style={styles.showCover} contentFit="cover" />
            <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
            <Text style={styles.showMeta}>{show.creatorName}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function PodcastsScreen() {
  const router = useRouter();
  const tabInset = useTabBarInset();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const { playEpisode } = usePodcastPlayer();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');

  const featuredShow = mockPodcastShows[0];
  const featuredEpisode = mockPodcastEpisodes[0];

  const filteredEpisodes = useMemo(() => {
    if (category === 'All') return mockPodcastEpisodes;
    const idx = CATEGORIES.indexOf(category) - 1;
    return mockPodcastEpisodes.filter((_, i) => i % (CATEGORIES.length - 1) === idx);
  }, [category]);

  const openShow = (show: PodcastShow) => {
    const ep = mockPodcastEpisodes.find((e) => e.showTitle === show.title) ?? mockPodcastEpisodes[0];
    playEpisode(ep);
    router.push(`/podcast/${ep.id}`);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.list}
        nestedScrollEnabled
        data={filteredEpisodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: tabInset + 120 }}
        ListHeaderComponent={
          <View style={styles.pad}>
            <AppHeader
              title="Podcasts"
              showCreate
              searchScope="podcast"
              onCreatePress={() => requireAuth(() => trigger('podcast'))}
            />

            <Pressable
              style={styles.hero}
              onPress={() => {
                playEpisode(featuredEpisode);
                router.push(`/podcast/${featuredEpisode.id}`);
              }}
            >
              <Image source={{ uri: featuredShow.coverUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['transparent', withAlpha(colors.background, 0.95)]} style={StyleSheet.absoluteFill} />
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>Featured show</Text>
                <Text style={styles.heroTitle}>{featuredShow.title}</Text>
                <Text style={styles.heroSub}>{featuredShow.creatorName} · {featuredShow.episodeCount} episodes</Text>
                <Button
                  label="Play latest episode"
                  size="sm"
                  onPress={() => {
                    playEpisode(featuredEpisode);
                    router.push(`/podcast/${featuredEpisode.id}`);
                  }}
                />
              </View>
            </Pressable>

            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((c) => (
                <FilterChip key={c} label={c} active={category === c} onPress={() => setCategory(c)} style={styles.catChip} />
              ))}
            </ScrollView>

            <ShowRail title="Trending shows" shows={mockPodcastShows.slice(0, 3)} onShowPress={openShow} />
            <ShowRail title="Featured shows" shows={mockPodcastShows} onShowPress={openShow} />

            <Text style={styles.section}>Latest episodes</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.episode}
            onPress={() => {
              playEpisode(item);
              router.push(`/podcast/${item.id}`);
            }}
          >
            <Image source={{ uri: item.coverUrl ?? '' }} style={styles.epCover} contentFit="cover" />
            <View style={styles.epInfo}>
              <Text style={styles.epTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.epMeta}>{item.showTitle} · {formatDuration(item.durationSeconds)}</Text>
              <View style={styles.epActions}>
                <Text style={styles.badge}>{item.mediaType === 'video' ? 'Video' : 'Audio'}</Text>
                <Pressable hitSlop={8} onPress={() => playEpisode(item)} style={styles.playIcon}>
                  <Ionicons name="play-circle" size={28} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListFooterComponent={<PageFooter />}
      />
      <PodcastMiniPlayer />
      {flowHost}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  hero: {
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  heroEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  heroTitle: { color: colors.foreground, fontSize: 22, fontWeight: '800' },
  heroSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 4, marginBottom: 12 },
  catRow: { gap: 8, marginBottom: 16, paddingRight: 8 },
  catChip: { marginRight: 0 },
  railWrap: { marginBottom: 8 },
  rail: { gap: 12, paddingRight: 8 },
  showCard: { width: 120 },
  showCover: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.secondary },
  showTitle: { color: colors.foreground, fontSize: 12, fontWeight: '600', marginTop: 6 },
  showMeta: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
  section: { ...typography.h3, color: colors.foreground, marginBottom: 12, marginTop: 8 },
  episode: { flexDirection: 'row', gap: 12, marginBottom: 16, paddingHorizontal: 16 },
  epCover: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.secondary },
  epInfo: { flex: 1, justifyContent: 'center' },
  epTitle: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  epMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  epActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  badge: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  playIcon: { padding: 2 },
});
