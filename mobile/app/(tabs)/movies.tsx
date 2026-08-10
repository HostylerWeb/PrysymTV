import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NewReleaseCard,
  TrendingMovieCard,
  VideoCardTile,
} from '@/components/feed/VideoCardTile';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { SectionHeader } from '@/components/home/SectionHeader';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMoviesFeed } from '@/hooks/api/useMoviesFeed';
import { fetchMovieGenres, genreLabel, type CategoryItem } from '@/lib/api/categories';
import { radius, withAlpha } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { withContentServiceGate } from '@/components/layout/ContentServiceGate';
import { formatDuration, formatViewCount } from '@/utils/format-media';

const SORTS = ['Popularity', 'Top Rated', 'Newest', 'A-Z'] as const;

function MoviesScreen() {
  const styles = useThemedStyles(createMoviesStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [genre, setGenre] = useState('all');
  const [genreOptions, setGenreOptions] = useState<CategoryItem[]>([]);
  const [year, setYear] = useState('All Years');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Popularity');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [infoOpen, setInfoOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const moviesQuery = useMoviesFeed();
  const allMovies = moviesQuery.data?.items ?? [];

  useEffect(() => {
    void fetchMovieGenres().then((res) => setGenreOptions(res.items));
  }, []);

  const genreFilters = useMemo(
    () => [{ slug: 'all', label: 'All' }, ...genreOptions],
    [genreOptions],
  );

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const movie of allMovies) {
      if (movie.releaseYear) years.add(movie.releaseYear);
    }
    const sorted = [...years].sort((a, b) => b - a);
    return ['All Years', ...sorted.map(String)];
  }, [allMovies]);
  const featuredCandidate = moviesQuery.data?.featured;
  const featured =
    featuredCandidate?.id ? featuredCandidate : allMovies[0];
  const trending = allMovies.slice(0, 3);
  const newReleases = allMovies.slice(0, 4);

  const filtered = useMemo(() => {
    let list = [...allMovies];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (genre !== 'all') {
      list = list.filter((m) => m.category === genre);
    }
    if (year !== 'All Years') {
      list = list.filter((m) => String(m.releaseYear) === year);
    }
    if (sort === 'Top Rated') {
      list.sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
    } else if (sort === 'Newest') {
      list.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
    } else if (sort === 'A-Z') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [allMovies, search, genre, year, sort]);

  const posterWidth = Math.floor((width - 32 - 24) / 3);
  const featuredGenre = featured
    ? genreLabel(featured.category ?? 'drama', genreOptions)
    : 'Drama';
  const isLoading = moviesQuery.isLoading && !moviesQuery.data;

  const onRefresh = async () => {
    setRefreshing(true);
    await moviesQuery.refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (moviesQuery.isError) {
    return (
      <View style={styles.screen}>
        <FeedQueryState isError error={moviesQuery.error} onRetry={() => void moviesQuery.refetch()} />
      </View>
    );
  }

  if (!featured) {
    return (
      <View style={styles.screen}>
        <FeedQueryState
          isEmpty
          emptyTitle="No movies yet"
          emptyMessage="Movies will appear here when they are published."
          onRetry={() => void moviesQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <View style={[styles.headerPad, { paddingTop: insets.top }]}>
        <AppHeader title="Movies" searchScope="movie" showNotifications={false} edgeToEdge />
      </View>
      <View style={styles.hero}>
        <Image source={{ uri: featured.thumbnailUrl ?? '' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.heroGradBottom} />
        <View style={styles.heroGradLeft} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>NEW</Text>
            </View>
            <Text style={styles.heroGenre}>{featuredGenre}</Text>
          </View>
          <Text style={styles.heroTitle}>{featured.title}</Text>
          <Text style={styles.heroMeta}>
            {formatViewCount(featured.viewsCount ?? 0)} views · {featured.releaseYear} · {formatDuration(featured.durationSeconds)}
          </Text>
          <Text style={styles.heroDesc} numberOfLines={2}>{featured.tagline}</Text>
          <View style={styles.heroActions}>
            <Button label="Play Now" onPress={() => router.push(`/movie/${featured.id}`)} style={styles.playBtn} />
            <Pressable style={styles.iconAction} onPress={() => setInfoOpen(true)}>
              <Ionicons name="information-circle-outline" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
        {genreFilters.map((g) => (
          <FilterChip
            key={g.slug}
            label={g.label}
            active={genre === g.slug}
            variant="inverted"
            onPress={() => setGenre(g.slug)}
            style={styles.genreChip}
          />
        ))}
      </ScrollView>

      <View style={styles.block}>
        <SectionHeader title="Trending Now" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {trending.map((m, i) => (
            <TrendingMovieCard key={m.id} video={m} rank={i + 1} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.block}>
        <SectionHeader title="New Releases" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {newReleases.map((m) => (
            <NewReleaseCard key={m.id} video={m} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.block, styles.padH]}>
        <View style={styles.allMoviesHeader}>
          <SectionHeader title="All Movies" />
          <View style={styles.viewToggle}>
            <Pressable style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnOn]} onPress={() => setViewMode('grid')}>
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? colors.primary : colors.mutedForeground} />
            </Pressable>
            <Pressable style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnOn]} onPress={() => setViewMode('list')}>
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? colors.primary : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search movies..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterSelect
            label="Genre"
            value={genreFilters.find((g) => g.slug === genre)?.label ?? 'All Genres'}
            options={['All Genres', ...genreFilters.filter((g) => g.slug !== 'all').map((g) => g.label)]}
            onChange={(v) => {
              const match = genreFilters.find((g) => g.label === v);
              setGenre(match?.slug ?? 'all');
            }}
          />
          <FilterSelect label="Year" value={year} options={yearOptions} onChange={setYear} />
          <FilterSelect
            label="Sort"
            value={`Sort: ${sort}`}
            options={SORTS.map((s) => `Sort: ${s}`)}
            onChange={(v) => setSort(v.replace('Sort: ', '') as typeof sort)}
          />
        </ScrollView>
        {viewMode === 'grid' ? (
          <View style={styles.posterGrid}>
            {filtered.map((m) => (
              <VideoCardTile key={m.id} video={m} variant="posterGrid" width={posterWidth} />
            ))}
          </View>
        ) : (
          <View style={styles.listView}>
            {filtered.map((m) => (
              <Pressable key={m.id} style={styles.listRow} onPress={() => router.push(`/movie/${m.id}`)}>
                <Image source={{ uri: m.thumbnailUrl ?? '' }} style={styles.listThumb} contentFit="cover" />
                <View style={styles.listMeta}>
                  <Text style={styles.listTitle} numberOfLines={2}>{m.title}</Text>
                  <Text style={styles.listSub}>
                    {formatViewCount(m.viewsCount ?? 0)} views · {m.releaseYear} · {formatDuration(m.durationSeconds)}
                  </Text>
                  <Text style={styles.listTagline} numberOfLines={2}>{m.tagline}</Text>
                </View>
                <Ionicons name="play-circle" size={28} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}
        {filtered.length === 0 && (
          <Text style={styles.empty}>No movies found matching your filters.</Text>
        )}
        <PageFooter />
      </View>
    </ScrollView>

    <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setInfoOpen(false)}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{featured.title}</Text>
          <Text style={styles.modalMeta}>
            {featuredGenre} · {featured.releaseYear} · {formatDuration(featured.durationSeconds)}
          </Text>
          <Text style={styles.modalDesc}>{featured.tagline}</Text>
          <Text style={styles.modalStats}>
            {formatViewCount(featured.viewsCount ?? 0)} views · {formatViewCount(featured.likesCount ?? 0)} likes
          </Text>
          <Button label="Play Now" onPress={() => { setInfoOpen(false); router.push(`/movie/${featured.id}`); }} />
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

function createMoviesStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    headerPad: { paddingHorizontal: 16 },
    hero: { aspectRatio: 16 / 10, backgroundColor: colors.muted },
    heroGradBottom: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.heroScrim },
    heroGradLeft: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.heroScrimLight },
    heroContent: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16 },
    heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    newPill: { backgroundColor: colors.primary + 'E6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    newPillText: { color: colors.primaryForeground, fontSize: 10, fontWeight: '800' },
    heroGenre: { color: colors.foreground + 'CC', fontSize: 13 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: colors.foreground, marginBottom: 6 },
    heroMeta: { color: colors.foreground + 'CC', fontSize: 13, marginBottom: 8 },
    heroDesc: { color: colors.foreground + 'B3', fontSize: 13, marginBottom: 12, maxWidth: '90%' },
    heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    playBtn: { paddingHorizontal: 20 },
    iconAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    genreRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
    genreChip: { marginRight: 0 },
    block: { marginBottom: 8, paddingTop: 8 },
    hRow: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
    padH: { paddingHorizontal: 16 },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.secondary,
      borderRadius: radius.lg,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 12,
    },
    searchInput: { flex: 1, color: colors.foreground, fontSize: 14 },
    filterRow: { gap: 8, marginBottom: 16, paddingRight: 8 },
    posterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    listView: { gap: 10 },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listThumb: { width: 64, height: 96, borderRadius: radius.md, backgroundColor: colors.secondary },
    listMeta: { flex: 1 },
    listTitle: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
    listSub: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
    listTagline: { color: colors.mutedForeground, fontSize: 12, marginTop: 6, lineHeight: 16 },
    allMoviesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    viewToggle: { flexDirection: 'row', gap: 4, backgroundColor: colors.secondary, borderRadius: radius.full, padding: 2 },
    viewBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
    viewBtnOn: { backgroundColor: colors.background },
    empty: { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: 20,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { color: colors.foreground, fontSize: 20, fontWeight: '800' },
    modalMeta: { color: colors.mutedForeground, fontSize: 13 },
    modalDesc: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
    modalStats: { color: colors.mutedForeground, fontSize: 12, marginBottom: 8 },
  });
}

export default withContentServiceGate('movies', MoviesScreen);
