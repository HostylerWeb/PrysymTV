import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContentRow } from '@/components/tv/ContentRow';
import { ContentCard } from '@/components/tv/ContentCard';
import { usePodcastsCatalog } from '@/hooks/api/usePodcastsCatalog';
import { colors, spacing, typography } from '@/theme/tokens';
import { withContentServiceGate } from '@/components/tv/ContentServiceGate';

function PodcastsScreen() {
  const router = useRouter();
  const { data, isLoading, error } = usePodcastsCatalog();

  const openShow = (showTitle: string) => {
    const episode = data?.episodes.find((ep) => ep.showTitle === showTitle);
    if (episode) {
      router.push({ pathname: '/podcast/[id]', params: { id: episode.id } });
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Podcasts</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load podcasts.</Text>
      ) : (
        <>
          {data?.featuredShow ? (
            <View style={styles.featured}>
              <Text style={styles.rowTitle}>Featured</Text>
              <ContentCard
                title={data.featuredShow.title}
                thumbnailUrl={data.featuredShow.coverUrl}
                subtitle={data.featuredShow.creatorName}
                hasTVPreferredFocus
                onPress={() => openShow(data.featuredShow!.title)}
              />
            </View>
          ) : null}
          <ContentRow
            title="Latest episodes"
            items={(data?.episodes ?? []).map((ep) => ({
              id: ep.id,
              title: ep.title,
              thumbnailUrl: ep.coverUrl,
              durationSeconds: ep.durationSeconds,
              type: 'video',
              channel: ep.showTitle,
              channelSlug: '',
            }))}
            onItemPress={(item) =>
              router.push({ pathname: '/podcast/[id]', params: { id: item.id } })
            }
          />
          <View style={styles.shows}>
            <Text style={styles.rowTitle}>Shows</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {(data?.shows ?? []).map((show, index) => (
                <ContentCard
                  key={show.id}
                  title={show.title}
                  thumbnailUrl={show.coverUrl}
                  subtitle={`${show.episodeCount} episodes`}
                  hasTVPreferredFocus={!data?.featuredShow && index === 0}
                  onPress={() => openShow(show.title)}
                />
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.xl, paddingRight: spacing.lg },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  featured: { marginBottom: spacing.xl },
  rowTitle: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  shows: { marginTop: spacing.md },
  error: { color: '#ff6b6b', fontSize: typography.body, paddingHorizontal: spacing.lg },
});

export default withContentServiceGate('podcasts', PodcastsScreen);
