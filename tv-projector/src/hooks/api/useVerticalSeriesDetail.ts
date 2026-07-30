import { useQuery } from '@tanstack/react-query';
import { fetchVerticalSeries } from '@/lib/api/verticals';
import { mediaThumb } from '@/lib/api/map-content';
import type { VerticalSeriesDetail } from '@/types/api';

function mapSeries(raw: VerticalSeriesDetail): VerticalSeriesDetail {
  return {
    ...raw,
    posterUrl: mediaThumb(raw.posterUrl),
    bannerUrl: mediaThumb(raw.bannerUrl),
    episodes: raw.episodes.map((ep) => ({
      ...ep,
      thumbnailUrl: mediaThumb(ep.thumbnailUrl),
    })),
    creator: raw.creator
      ? { ...raw.creator, avatarUrl: mediaThumb(raw.creator.avatarUrl) }
      : null,
  };
}

export function useVerticalSeriesDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['vertical', slug],
    enabled: Boolean(slug),
    queryFn: async () => mapSeries(await fetchVerticalSeries(slug!)),
  });
}
