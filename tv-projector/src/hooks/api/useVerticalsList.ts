import { useQuery } from '@tanstack/react-query';
import { fetchVerticals } from '@/lib/api/verticals';
import { mapVerticalSeries } from '@/lib/api/map-content';
import type { VerticalSeries } from '@/types/api';

export function useVerticalsList() {
  return useQuery({
    queryKey: ['verticals', 'list'],
    queryFn: async (): Promise<VerticalSeries[]> => {
      const data = await fetchVerticals();
      return (data.items as Parameters<typeof mapVerticalSeries>[0][]).map(mapVerticalSeries);
    },
  });
}
