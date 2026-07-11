import { proxyMediaAssetUrl, resolvePlaybackUrl } from '@/lib/media-url';
import type {
  ContinueWatchingFeedItem,
  ContinueWatchingItem,
  LiveStream,
  PodcastEpisode,
  PodcastShow,
  VerticalSeries,
  VideoCard,
  VideoCardDetail,
} from '@/types/api';

export function mediaThumb(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return proxyMediaAssetUrl(trimmed);
}

function normalizeVideoType(type: string | undefined | null): VideoCard['type'] {
  if (type === 'movie' || type === 'short') return type;
  return 'video';
}

export function mapVideoCard(raw: VideoCardDetail | Record<string, unknown>): VideoCard {
  const r = raw as VideoCardDetail & { posterUrl?: string | null };
  return {
    id: r.id,
    title: r.title,
    thumbnailUrl: mediaThumb(r.posterUrl ?? r.thumbnailUrl) ?? mediaThumb(r.thumbnailUrl),
    durationSeconds: r.durationSeconds ?? 0,
    viewsCount: r.viewsCount,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    type: normalizeVideoType(r.type),
    category: r.category ?? undefined,
    channel: r.channel ?? 'Creator',
    channelSlug: r.channelSlug ?? 'creator',
    creatorId: r.creatorId,
    releaseYear: r.releaseYear,
    ageRating: r.ageRating,
    tagline: r.tagline,
    liked: r.liked,
    saved: r.saved,
    isFollowing: r.isFollowing,
    isLive: r.isLive,
    isNew: r.isNew,
    isPaid: (r as { isPaid?: boolean }).isPaid,
    entryCoinCost: (r as { entryCoinCost?: number | null }).entryCoinCost,
    playbackUrl: resolvePlaybackUrl(r as Parameters<typeof resolvePlaybackUrl>[0]),
  };
}

type FeedLiveItem = {
  id: string;
  slug?: string;
  title: string;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  streamer: string;
  streamerSlug: string;
  streamerAvatar?: string | null;
  viewers?: number;
  viewerCount?: number;
  category?: string | null;
  isPaid?: boolean;
  entryCoinCost?: number | null;
  entryPriceUsd?: number | null;
};

export function mapFeedLiveStream(raw: FeedLiveItem): LiveStream {
  return {
    id: raw.id,
    title: raw.title,
    thumbnailUrl: mediaThumb(raw.thumbnailUrl ?? raw.thumbnail),
    viewerCount: raw.viewers ?? raw.viewerCount ?? 0,
    category: raw.category ?? 'Live',
    streamer: raw.streamer,
    streamerSlug: raw.streamerSlug,
    avatarUrl: mediaThumb(raw.streamerAvatar),
    isPaid: raw.isPaid,
    entryCoinCost: raw.entryCoinCost,
    entryPriceUsd: raw.entryPriceUsd,
  };
}

type StreamDetailLike = {
  id: string;
  title: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  streamer: string;
  streamerSlug: string;
  streamerAvatar?: string | null;
  viewerCount: number;
  category?: string | null;
};

export function mapStreamDetail(raw: StreamDetailLike): LiveStream {
  return mapFeedLiveStream({
    id: raw.id,
    title: raw.title,
    thumbnailUrl: raw.thumbnail ?? raw.thumbnailUrl,
    streamer: raw.streamer,
    streamerSlug: raw.streamerSlug,
    streamerAvatar: raw.streamerAvatar,
    viewerCount: raw.viewerCount,
    category: raw.category,
  });
}

export function mapContinueWatchingItem(item: ContinueWatchingFeedItem): ContinueWatchingItem {
  return {
    contentType: item.contentType,
    contentId: item.contentId,
    title: item.title,
    thumbnailUrl: mediaThumb(item.thumbnailUrl),
    progressSeconds: item.progressSeconds,
    durationSeconds: item.durationSeconds,
    subtitle: item.subtitle,
    seriesSlug: item.seriesSlug,
  };
}

type ApiVerticalSeries = {
  id?: string;
  slug: string;
  title: string;
  tagline?: string | null;
  posterUrl?: string | null;
  genre?: string | null;
  totalEpisodes?: number;
};

export function mapVerticalSeries(raw: ApiVerticalSeries): VerticalSeries {
  return {
    slug: raw.slug,
    title: raw.title,
    posterUrl: mediaThumb(raw.posterUrl),
    genre: raw.genre ?? undefined,
    episodeCount: raw.totalEpisodes ?? 0,
    description: raw.tagline ?? undefined,
  };
}

type ApiPodcastShow = {
  id: string;
  title: string;
  coverUrl?: string | null;
  creator?: { username: string; displayName?: string | null };
  _count?: { episodes: number };
};

export function mapPodcastShow(raw: ApiPodcastShow): PodcastShow {
  return {
    id: raw.id,
    title: raw.title,
    coverUrl: mediaThumb(raw.coverUrl),
    creatorName: raw.creator?.displayName ?? raw.creator?.username ?? 'Host',
    episodeCount: raw._count?.episodes ?? 0,
  };
}

type ApiPodcastEpisode = {
  id: string;
  title: string;
  coverUrl?: string | null;
  durationSeconds?: number;
  mediaType?: 'audio' | 'video';
  videoUrl?: string | null;
  show?: { title: string; coverUrl?: string | null };
};

export function mapPodcastEpisode(raw: ApiPodcastEpisode): PodcastEpisode {
  return {
    id: raw.id,
    title: raw.title,
    coverUrl: mediaThumb(raw.coverUrl ?? raw.show?.coverUrl),
    durationSeconds: raw.durationSeconds ?? 0,
    showTitle: raw.show?.title ?? 'Podcast',
    mediaType: raw.mediaType ?? (raw.videoUrl ? 'video' : 'audio'),
  };
}
