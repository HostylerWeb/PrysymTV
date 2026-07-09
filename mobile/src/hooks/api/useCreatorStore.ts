import { useQuery } from '@tanstack/react-query';
import { fetchCreatorStore } from '@/lib/api/stores';
import { mediaThumb } from '@/lib/api/map-content';
import type { CreatorStoreSummary, PublicStoreProduct } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type CreatorStoreProductView = PublicStoreProduct & {
  imageDisplayUrl: string | null;
  galleryDisplayUrls: string[];
};

export type CreatorStoreData = {
  store: CreatorStoreSummary;
  creatorUsername: string;
  products: CreatorStoreProductView[];
};

function mapStoreProduct(product: PublicStoreProduct): CreatorStoreProductView {
  return {
    ...product,
    imageDisplayUrl: mediaThumb(product.imageUrl),
    galleryDisplayUrls: (product.galleryUrls ?? [])
      .map((url) => mediaThumb(url))
      .filter(Boolean) as string[],
  };
}

export function useCreatorStore(username: string | undefined, enabled = true) {
  const slug = username ? normalizeUsernameSlug(username) : '';
  return useQuery({
    queryKey: ['creator', 'store', slug],
    enabled: Boolean(slug) && enabled,
    queryFn: async (): Promise<CreatorStoreData> => {
      const data = await fetchCreatorStore(slug);
      return {
        store: data.store,
        creatorUsername: data.creatorUsername,
        products: data.products.map(mapStoreProduct),
      };
    },
  });
}
