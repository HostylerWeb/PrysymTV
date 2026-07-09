/** API-aligned types — mirror lib/api/types.ts + api.md VideoCard */

export type AuthUserResponse = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUserResponse;
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
};

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

/** Feed / browse card shape returned by most video list endpoints. */
export type VideoCardDetail = VideoCard;

export type VideoRecord = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewsCount?: number;
  type?: string;
  status?: string;
  creator?: {
    username: string;
    displayName: string | null;
  };
};

export type PaginatedVideos = {
  items: VideoRecord[];
  meta: PaginatedMeta;
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
  insiderActive?: boolean;
  insiderPeriodEnd?: string | null;
  createdAt?: string;
  buyerFullName?: string | null;
  buyerPhone?: string | null;
  buyerAddressLine1?: string | null;
  buyerAddressLine2?: string | null;
  buyerCity?: string | null;
  buyerState?: string | null;
  buyerPostalCode?: string | null;
  buyerCountryCode?: string | null;
  socialLinks?: unknown[];
  notificationPrefs?: unknown[];
  followersCount: number;
  followingCount: number;
  videosCount: number;
};

export type UpdateMeBody = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  buyerFullName?: string;
  buyerPhone?: string;
  buyerAddressLine1?: string;
  buyerAddressLine2?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerPostalCode?: string;
  buyerCountryCode?: string;
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

export type PodcastEpisodeRecord = {
  id: string;
  title: string;
  coverUrl: string | null;
  durationSeconds: number;
  show?: { title: string };
};

export type VerticalSeries = {
  slug: string;
  title: string;
  posterUrl: string | null;
  genre?: string;
  episodeCount: number;
  description?: string;
};

export type VerticalEpisodeHistoryRecord = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  episodeNumber: number;
  series: { slug: string; title: string; posterUrl: string | null };
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

export type ContinueWatchingFeedItem = {
  contentType: 'video' | 'podcast_episode' | 'vertical_episode';
  contentId: string;
  progressSeconds: number;
  completed: boolean;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  videoType?: string;
  subtitle?: string;
  seriesSlug?: string;
  episodeNumber?: number;
};

export type HistoryItemRecord = {
  contentType: string;
  contentId: string;
  progressSeconds: number;
  completed: boolean;
  updatedAt: string;
  video: VideoRecord | null;
  podcastEpisode?: PodcastEpisodeRecord | null;
  verticalEpisode?: VerticalEpisodeHistoryRecord | null;
};

export type SavedItemRecord = {
  itemType: string;
  itemId: string;
  createdAt: string;
  video: VideoRecord | null;
  podcastEpisode?: PodcastEpisodeRecord | null;
  verticalEpisode?: VerticalEpisodeHistoryRecord | null;
  verticalSeries?: {
    id: string;
    slug: string;
    title: string;
    posterUrl: string | null;
  } | null;
};

export type LikedItemRecord = {
  targetType: string;
  targetId: string;
  createdAt: string;
  video: VideoRecord | null;
  podcastEpisode?: PodcastEpisodeRecord | null;
  verticalEpisode?: VerticalEpisodeHistoryRecord | null;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
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
