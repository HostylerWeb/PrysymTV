import { useQuery } from '@tanstack/react-query';
import { fetchSearch } from '@/lib/api/search';
import { mediaThumb } from '@/lib/api/map-content';
import { isVideoTypeEnabled } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';

export function useSearch(query: string) {
  const { services } = useContentServices();

  return useQuery({
    queryKey: ['search', query, services],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const data = await fetchSearch(query.trim());
      const videosEnabled = services.videos;
      const moviesEnabled = services.movies;
      const shortsEnabled = services.shorts;
      const podcastsEnabled = services.podcasts;
      const verticalsEnabled = services.verticals;

      return {
        videos: videosEnabled
          ? data.videos
              .filter((v) => v.type !== 'movie' && v.type !== 'short')
              .filter((v) => isVideoTypeEnabled(services, v.type))
              .map((v) => ({
                id: v.id,
                title: v.title,
                thumbnailUrl: mediaThumb(v.thumbnailUrl),
                type: v.type,
              }))
          : [],
        movies: moviesEnabled
          ? data.videos
              .filter((v) => v.type === 'movie')
              .map((v) => ({
                id: v.id,
                title: v.title,
                thumbnailUrl: mediaThumb(v.thumbnailUrl),
                type: v.type,
              }))
          : [],
        shorts: shortsEnabled
          ? data.videos
              .filter((v) => v.type === 'short')
              .map((v) => ({
                id: v.id,
                title: v.title,
                thumbnailUrl: mediaThumb(v.thumbnailUrl),
                type: v.type,
              }))
          : [],
        podcasts: podcastsEnabled
          ? data.podcasts.map((p) => ({
              id: p.id,
              title: p.title,
              thumbnailUrl: mediaThumb(p.coverUrl),
            }))
          : [],
        verticals: verticalsEnabled
          ? data.verticals.map((v) => ({
              slug: v.slug,
              title: v.title,
              thumbnailUrl: mediaThumb(v.posterUrl),
              episodes: v.totalEpisodes,
            }))
          : [],
        streams: data.streams.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.creator.displayName ?? s.creator.username,
        })),
      };
    },
  });
}
