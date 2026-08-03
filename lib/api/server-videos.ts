import type { Metadata } from 'next';
import { serverFetchJson } from '@/lib/api/server-fetch';
import type { VideoDetail } from '@/lib/api/videos';

export async function fetchVideoForMetadata(id: string): Promise<VideoDetail | null> {
  try {
    return await serverFetchJson<VideoDetail>(`/videos/${id}`, { revalidate: 120 });
  } catch {
    return null;
  }
}

export async function buildVideoMetadata(id: string): Promise<Metadata> {
  const video = await fetchVideoForMetadata(id);
  if (!video) {
    return { title: 'Watch | Prysym TV' };
  }

  const title = `${video.title} | Prysym TV`;
  const description = video.description?.slice(0, 200) || `Watch ${video.title} on Prysym TV`;
  const image = video.thumbnailUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'video.other',
      images: image ? [{ url: image, alt: video.title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
