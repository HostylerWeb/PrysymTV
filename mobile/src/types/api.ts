/** API-aligned types - mirror lib/api/types.ts + api.md VideoCard */
export type VideoCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  type: 'short' | 'video' | 'movie';
  category?: string;
  channel: string;
  channelSlug: string;
  creatorId?: string;
  releaseYear?: number | null;
  ageRating?: string | null;
  tagline?: string | null;
  liked?: boolean;
  saved?: boolean;
  isFollowing?: boolean;
  isLive?: boolean;
  isNew?: boolean;
};

export type MeResponse = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  streamerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  verticalCreatorStatus: 'none' | 'pending' | 'approved' | 'rejected';
  storeCreatorStatus: 'none' | 'pending' | 'approved' | 'rejected';
  coinsBalance: number;
  premiumTier: string;
  premiumExpiresAt: string | null;
  followersCount: number;
  followingCount: number;
  videosCount: number;
};

export type PublicUser = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  hasStore?: boolean;
  isFollowing?: boolean;
  isLive?: boolean;
  liveStreamId?: string | null;
};

export type LiveStream = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewerCount: number;
  category: string;
  streamer: string;
  streamerSlug: string;
  avatarUrl: string | null;
};

export type PodcastShow = {
  id: string;
  title: string;
  coverUrl: string | null;
  creatorName: string;
  episodeCount: number;
};

export type PodcastEpisode = {
  id: string;
  title: string;
  coverUrl: string | null;
  durationSeconds: number;
  showTitle: string;
  mediaType: 'audio' | 'video';
};

export type VerticalSeries = {
  slug: string;
  title: string;
  posterUrl: string | null;
  genre?: string;
  episodeCount: number;
  description?: string;
};

export type NotificationItem = {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'live' | 'gift' | 'upload' | 'system';
  message: string;
  isRead: boolean;
  createdAt: string;
  actorUsername?: string;
};

export type PlaylistSummary = {
  id: string;
  title: string;
  itemCount: number;
  thumbnailUrl: string | null;
};

export type ContinueWatchingItem = {
  contentType: 'video' | 'podcast_episode' | 'vertical_episode';
  contentId: string;
  title: string;
  thumbnailUrl: string | null;
  progressSeconds: number;
  durationSeconds: number;
  subtitle?: string;
  seriesSlug?: string;
};

export type StoreProduct = {
  id: string;
  title: string;
  description?: string | null;
  priceUsd: string;
  imageUrl: string | null;
  galleryUrls?: string[];
  productType?: 'merchandise' | 'digital';
  inStock: boolean;
  inventory?: number | null;
  inventoryUnlimited?: boolean;
  shippingFree?: boolean;
  shippingFeeUsd?: number;
  creatorUsername?: string;
};
