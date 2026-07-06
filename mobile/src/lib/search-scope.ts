export type SearchScope = 'short' | 'video' | 'vertical' | 'podcast' | 'movie';

export const SEARCH_SCOPE_CONFIG: Record<
  SearchScope,
  { placeholder: string; emptyHint: string; resultsLabel: string }
> = {
  short: {
    placeholder: 'Search shorts…',
    emptyHint: 'Find short-form vertical videos.',
    resultsLabel: 'Shorts',
  },
  video: {
    placeholder: 'Search long-form videos…',
    emptyHint: 'Find creator videos — not movies or shorts.',
    resultsLabel: 'Videos',
  },
  vertical: {
    placeholder: 'Search vertical series…',
    emptyHint: 'Find micro-drama series.',
    resultsLabel: 'Verticals',
  },
  podcast: {
    placeholder: 'Search podcasts…',
    emptyHint: 'Find podcast shows.',
    resultsLabel: 'Podcasts',
  },
  movie: {
    placeholder: 'Search movies…',
    emptyHint: 'Find feature films and theatrical releases.',
    resultsLabel: 'Movies',
  },
};

export function isSearchScope(value: string | undefined): value is SearchScope {
  return (
    value === 'short' ||
    value === 'video' ||
    value === 'vertical' ||
    value === 'podcast' ||
    value === 'movie'
  );
}
