import type { Metadata } from 'next';
import { serverFetchJson } from '@/lib/api/server-fetch';
import type { PublicCreatorProfile } from '@/lib/api/users';

export async function fetchCreatorForMetadata(slug: string): Promise<PublicCreatorProfile | null> {
  try {
    return await serverFetchJson<PublicCreatorProfile>(
      `/users/${encodeURIComponent(slug)}`,
      { revalidate: 300 },
    );
  } catch {
    return null;
  }
}

export async function buildCreatorMetadata(slug: string): Promise<Metadata> {
  const profile = await fetchCreatorForMetadata(slug);
  if (!profile) {
    return { title: 'Creator | Prysym TV' };
  }

  const title = `${profile.displayName || profile.username} | Prysym TV`;
  const description =
    profile.bio?.slice(0, 200) ||
    `Watch videos and live streams from ${profile.displayName || profile.username} on Prysym TV`;
  const image = profile.avatarUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: image ? [{ url: image, alt: profile.displayName || profile.username }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
