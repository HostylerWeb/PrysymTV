import type { Metadata } from 'next';
import { buildVideoMetadata } from '@/lib/api/server-videos';
import WatchPageClient from './watch-page-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildVideoMetadata(id);
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params;
  return <WatchPageClient videoId={id} />;
}
