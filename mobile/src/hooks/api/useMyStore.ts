import { useQuery } from '@tanstack/react-query';
import { fetchMyStore } from '@/lib/api/stores';
import { mediaThumb } from '@/lib/api/map-content';
import type { CreatorStoreSummary, SellerStoreProduct } from '@/types/api';

export type MyStoreProductView = SellerStoreProduct & {
  imageDisplayUrl: string | null;
};

export type MyStoreData = {
  store: CreatorStoreSummary;
  products: MyStoreProductView[];
};

export function useMyStore(enabled = true) {
  return useQuery({
    queryKey: ['store', 'me'],
    enabled,
    queryFn: async (): Promise<MyStoreData> => {
      const data = await fetchMyStore();
      return {
        store: data.store,
        products: data.products.map((p) => ({
          ...p,
          imageDisplayUrl: mediaThumb(p.imageUrl),
        })),
      };
    },
  });
}
