import { useQuery } from '@tanstack/react-query';
import { fetchVerticals } from '@/lib/api/verticals';
import { mapVerticalSeries } from '@/lib/api/map-content';
import type { VerticalSeries } from '@/types/api';

export function useVerticalsList(enabled = true) {
  return useQuery({
    queryKey: ['verticals', 'list'],
    enabled,
    queryFn: async (): Promise<VerticalSeries[]> => {
      const data = await fetchVerticals();
      return (data.items as Parameters<typeof mapVerticalSeries>[0][]).map(mapVerticalSeries);
    },
  });
}
