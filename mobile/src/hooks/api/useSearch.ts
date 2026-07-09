import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSearch, fetchSearchSuggest, type SearchResponse } from '@/lib/api/search';
import { mediaThumb } from '@/lib/api/map-content';
import { formatViewCount } from '@/utils/format-media';
import type { SearchScope } from '@/lib/search-scope';

export type SearchResultTab =
  | 'All'
  | 'Videos'
  | 'Creators'
  | 'Podcasts'
  | 'Movies'
  | 'Live'
  | 'Shorts'
  | 'Verticals';

export type SearchResult = {
  type: SearchResultTab;
  title: string;
  subtitle?: string;
  thumb?: string;
  id: string;
  route: string;
};

const SCOPE_API_TYPE: Partial<Record<SearchScope, string>> = {
  short: 'video',
  video: 'video',
  vertical: 'video',
  podcast: 'podcast',
  movie: 'video',
};

function hrefForVideo(id: string, type: string): string {
  if (type === 'short') return `/(tabs)/shorts?start=${id}`;
  if (type === 'movie') return `/movie/${id}`;
  return `/watch/${id}`;
}

function mapSearchResponse(res: SearchResponse, tab: SearchResultTab): SearchResult[] {
  const results: SearchResult[] = [];

  const includeVideos = tab === 'All' || tab === 'Videos' || tab === 'Movies' || tab === 'Shorts';
  if (includeVideos) {
    for (const v of res.videos) {
      const videoTab: SearchResultTab =
        v.type === 'short' ? 'Shorts' : v.type === 'movie' ? 'Movies' : 'Videos';
      if (tab !== 'All' && tab !== videoTab) continue;
      results.push({
        type: videoTab,
        title: v.title,
        subtitle: `${formatViewCount(v.viewsCount)} views`,
        thumb: mediaThumb(v.thumbnailUrl) ?? undefined,
        id: v.id,
        route: hrefForVideo(v.id, v.type),
      });
    }
  }

  if (tab === 'All' || tab === 'Creators') {
    for (const c of res.creators) {
      results.push({
        type: 'Creators',
        title: c.displayName ?? c.username,
        subtitle: `@${c.username}`,
        thumb: mediaThumb(c.avatarUrl) ?? undefined,
        id: c.username,
        route: `/creator/${c.username}`,
      });
    }
  }

  if (tab === 'All' || tab === 'Podcasts') {
    for (const p of res.podcasts) {
      results.push({
        type: 'Podcasts',
        title: p.title,
        subtitle: p.category ?? 'Podcast',
        thumb: mediaThumb(p.coverUrl) ?? undefined,
        id: p.id,
        route: `/podcast/${p.id}`,
      });
    }
  }

  if (tab === 'All' || tab === 'Live') {
    for (const s of res.streams) {
      results.push({
        type: 'Live',
        title: s.title,
        subtitle: s.creator.displayName ?? s.creator.username,
        id: s.id,
        route: `/live/${s.id}`,
      });
    }
  }

  if (tab === 'All' || tab === 'Verticals') {
    for (const v of res.verticals) {
      results.push({
        type: 'Verticals',
        title: v.title,
        subtitle: `${v.totalEpisodes} episodes`,
        thumb: mediaThumb(v.posterUrl) ?? undefined,
        id: v.slug,
        route: `/verticals/${v.slug}`,
      });
    }
  }

  return results;
}

export function useSearch(
  query: string,
  tab: SearchResultTab = 'All',
  scope?: SearchScope,
  enabled = true,
) {
  const trimmed = query.trim();
  const apiType = scope ? SCOPE_API_TYPE[scope] : undefined;

  const searchQuery = useQuery({
    queryKey: ['search', trimmed, apiType, tab],
    queryFn: async () => {
      const res = await fetchSearch(trimmed, apiType);
      return mapSearchResponse(res, tab);
    },
    enabled: enabled && trimmed.length > 0,
    staleTime: 15_000,
  });

  const suggestQuery = useQuery({
    queryKey: ['search', 'suggest', trimmed, apiType],
    queryFn: async () => {
      const res = await fetchSearchSuggest(trimmed, apiType);
      return res.suggestions;
    },
    enabled: enabled && trimmed.length > 0,
    staleTime: 15_000,
  });

  const suggestionLabels = useMemo(
    () => suggestQuery.data?.map((s) => s.label) ?? [],
    [suggestQuery.data],
  );

  return {
    results: searchQuery.data ?? [],
    suggestions: suggestionLabels,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
  };
}
