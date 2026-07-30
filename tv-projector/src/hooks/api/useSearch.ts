import { useQuery } from '@tanstack/react-query';
import { fetchSearch } from '@/lib/api/search';
import { mediaThumb } from '@/lib/api/map-content';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const data = await fetchSearch(query.trim());
      return {
        videos: data.videos
          .filter((v) => v.type !== 'movie' && v.type !== 'short')
          .map((v) => ({
          id: v.id,
          title: v.title,
          thumbnailUrl: mediaThumb(v.thumbnailUrl),
          type: v.type,
        })),
        movies: data.videos
          .filter((v) => v.type === 'movie')
          .map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: mediaThumb(v.thumbnailUrl),
            type: v.type,
          })),
        shorts: data.videos
          .filter((v) => v.type === 'short')
          .map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: mediaThumb(v.thumbnailUrl),
            type: v.type,
          })),
        podcasts: data.podcasts.map((p) => ({
          id: p.id,
          title: p.title,
          thumbnailUrl: mediaThumb(p.coverUrl),
        })),
        verticals: data.verticals.map((v) => ({
          slug: v.slug,
          title: v.title,
          thumbnailUrl: mediaThumb(v.posterUrl),
          episodes: v.totalEpisodes,
        })),
        streams: data.streams.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.creator.displayName ?? s.creator.username,
        })),
      };
    },
  });
}
