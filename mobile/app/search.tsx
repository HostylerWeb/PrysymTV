import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  SEARCH_SCOPE_CONFIG,
  isSearchScope,
  type SearchScope,
} from '@/lib/search-scope';
import { useSearch, type SearchResultTab } from '@/hooks/api/useSearch';
import { radius } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

const SUGGESTIONS = ['studio tour', 'live', 'podcast', 'city lights'];
const TABS: SearchResultTab[] = ['All', 'Videos', 'Creators', 'Podcasts', 'Movies', 'Live', 'Shorts', 'Verticals'];

const SCOPE_TAB: Partial<Record<SearchScope, SearchResultTab>> = {
  short: 'Shorts',
  video: 'Videos',
  vertical: 'Verticals',
  podcast: 'Podcasts',
  movie: 'Movies',
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createSearchStyles);
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const scope = isSearchScope(scopeParam) ? scopeParam : undefined;
  const scopeConfig = scope ? SEARCH_SCOPE_CONFIG[scope] : null;

  const [q, setQ] = useState('');
  const [tab, setTab] = useState<SearchResultTab>(scope ? (SCOPE_TAB[scope] ?? 'All') : 'All');
  const [recent, setRecent] = useState(['studio tour', 'democreator', 'midnight signal']);

  const visibleTabs = useMemo<SearchResultTab[]>(() => {
    if (scope === 'short') return ['Shorts'];
    if (scope === 'video') return ['Videos'];
    if (scope === 'vertical') return ['Verticals'];
    if (scope === 'podcast') return ['Podcasts'];
    if (scope === 'movie') return ['Movies'];
    return TABS;
  }, [scope]);

  const { results, suggestions, isLoading, isError, refetch } = useSearch(q, tab, scope);

  const pickRecent = (term: string) => {
    setQ(term);
    setRecent((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 6));
  };

  const openResult = (route: string) => {
    if (q.trim()) pickRecent(q.trim());
    router.push(route as never);
  };

  const placeholder = scopeConfig?.placeholder ?? 'Search Prysym TV';
  const suggestionItems = q.trim().length > 0 && suggestions.length > 0 ? suggestions : SUGGESTIONS;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={q}
          onChangeText={setQ}
          autoFocus
          returnKeyType="search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {scopeConfig ? (
        <Text style={styles.scopeHint}>{scopeConfig.emptyHint}</Text>
      ) : null}

      {q.length === 0 ? (
        <View style={styles.suggest}>
          <View style={styles.recentHeader}>
            <Text style={styles.label}>Recent searches</Text>
            {recent.length > 0 && (
              <Pressable onPress={() => setRecent([])}>
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            )}
          </View>
          {recent.length === 0 ? (
            <Text style={styles.emptyRecent}>No recent searches</Text>
          ) : (
            recent.map((s) => (
              <Pressable key={s} style={styles.recentRow} onPress={() => pickRecent(s)}>
                <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
                <Text style={styles.suggestItem}>{s}</Text>
              </Pressable>
            ))
          )}
          {!scope && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>Suggestions</Text>
              {suggestionItems.map((s) => (
                <Pressable key={s} style={styles.recentRow} onPress={() => pickRecent(s)}>
                  <Ionicons name="trending-up" size={16} color={colors.primary} />
                  <Text style={styles.suggestItem}>{s}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>
      ) : (
        <>
          {!scope && visibleTabs.length > 1 && (
            <View style={styles.tabs}>
              {visibleTabs.map((t) => (
                <Pressable key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabOnText]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
          ) : isError ? (
            <View style={styles.errorWrap}>
              <Text style={styles.noResults}>Search is unavailable. Check your connection.</Text>
              <Pressable onPress={() => void refetch()}>
                <Text style={styles.clear}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.noResults}>No results for "{q}"</Text>}
              renderItem={({ item }) => (
                <Pressable style={styles.result} onPress={() => openResult(item.route)}>
                  {item.thumb ? (
                    <Image source={{ uri: item.thumb }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="person" size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={styles.resultBody}>
                    <Text style={styles.resultType}>{item.type}</Text>
                    <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.resultSub} numberOfLines={1}>{item.subtitle}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

function createSearchStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
    back: { padding: 8 },
    input: {
      flex: 1,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.foreground,
    },
    scopeHint: { color: colors.mutedForeground, fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
    suggest: { padding: 16 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: colors.mutedForeground, fontSize: 12, fontWeight: '700' },
    clear: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    emptyRecent: { color: colors.mutedForeground, fontSize: 14, paddingVertical: 8 },
    recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    suggestItem: { color: colors.foreground, fontSize: 16 },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabOn: { backgroundColor: colors.primary + '18', borderColor: colors.primary },
    tabText: { color: colors.foreground, fontSize: 12, fontWeight: '600' },
    tabOnText: { color: colors.primary },
    list: { padding: 16, paddingBottom: 40 },
    noResults: { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 },
    errorWrap: { alignItems: 'center', padding: 24, gap: 8 },
    result: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.secondary },
    thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    resultBody: { flex: 1 },
    resultType: { color: colors.primary, fontSize: 11, fontWeight: '700' },
    resultTitle: { color: colors.foreground, fontSize: 15, fontWeight: '600', marginTop: 2 },
    resultSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  });
}
