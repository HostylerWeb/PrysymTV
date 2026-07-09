import { useQuery } from '@tanstack/react-query';
import { fetchStoreProduct } from '@/lib/api/stores';
import { mediaThumb } from '@/lib/api/map-content';
import type { CreatorStoreSummary, PublicStoreProduct } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type StoreProductDetailView = {
  store: CreatorStoreSummary;
  creatorUsername: string;
  product: PublicStoreProduct & {
    imageDisplayUrl: string | null;
    galleryDisplayUrls: string[];
  };
};

export function useStoreProduct(username: string | undefined, productId: string | undefined) {
  const slug = username ? normalizeUsernameSlug(username) : '';
  return useQuery({
    queryKey: ['creator', 'store', 'product', slug, productId],
    enabled: Boolean(slug && productId),
    queryFn: async (): Promise<StoreProductDetailView> => {
      const data = await fetchStoreProduct(slug, productId!);
      return {
        store: data.store,
        creatorUsername: data.creatorUsername,
        product: {
          ...data.product,
          imageDisplayUrl: mediaThumb(data.product.imageUrl),
          galleryDisplayUrls: (data.product.galleryUrls ?? [])
            .map((url) => mediaThumb(url))
            .filter(Boolean) as string[],
        },
      };
    },
  });
}
