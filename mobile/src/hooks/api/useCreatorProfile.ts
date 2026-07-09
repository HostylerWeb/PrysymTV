import { useQuery } from '@tanstack/react-query';
import { fetchPublicProfile } from '@/lib/api/users';
import { resolveAvatarUrl, resolveProfileMediaUrl } from '@/lib/media-url';
import type { PublicCreatorProfile } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type CreatorProfileView = PublicCreatorProfile & {
  avatarDisplayUrl: string;
  bannerDisplayUrl: string | null;
};

function mapCreatorProfile(raw: PublicCreatorProfile): CreatorProfileView {
  return {
    ...raw,
    avatarDisplayUrl: resolveAvatarUrl(raw.avatarUrl, raw.username),
    bannerDisplayUrl: resolveProfileMediaUrl(raw.bannerUrl),
  };
}

export function useCreatorProfile(username: string | undefined) {
  const slug = username ? normalizeUsernameSlug(username) : '';
  return useQuery({
    queryKey: ['creator', 'profile', slug],
    enabled: Boolean(slug),
    queryFn: async () => mapCreatorProfile(await fetchPublicProfile(slug)),
  });
}
