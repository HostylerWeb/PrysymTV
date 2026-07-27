import { useQuery } from '@tanstack/react-query';
import { fetchSearchSuggest } from '@/lib/api/search';

const SEED_QUERIES = ['live', 'podcast', 'game', 'music'];

export function useDefaultSearchSuggestions(enabled = true) {
  return useQuery({
    queryKey: ['search', 'default-suggestions'],
    queryFn: async () => {
      const labels = new Set<string>();
      for (const seed of SEED_QUERIES) {
        const res = await fetchSearchSuggest(seed);
        for (const item of res.suggestions.slice(0, 2)) {
          if (item.label?.trim()) labels.add(item.label.trim());
        }
      }
      return [...labels].slice(0, 8);
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
