import { useQuery } from '@tanstack/react-query';
import { fetchLiveStreams } from '@/lib/api/streams';
import { mapStreamDetail } from '@/lib/api/map-content';
import type { LiveStream } from '@/types/api';

export function useLiveStreams() {
  return useQuery({
    queryKey: ['streams', 'live'],
    queryFn: async (): Promise<LiveStream[]> => {
      const data = await fetchLiveStreams();
      return data.items.map(mapStreamDetail);
    },
    refetchInterval: 30_000,
  });
}
