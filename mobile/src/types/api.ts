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
  channelAvatar?: string | null;
  creatorId?: string;
  releaseYear?: number | null;
  ageRating?: string | null;
  tagline?: string | null;
  liked?: boolean;
  saved?: boolean;
  isFollowing?: boolean;
  isLive?: boolean;
  isNew?: boolean;
  isPaid?: boolean;
  entryCoinCost?: number | null;
  playbackUrl?: string | null;
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
  gender?: string | null;
  birthDate?: string | null;
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
  gender?: string;
  birthDate?: string;
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

export type PublicCreatorProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  streamerStatus: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  isLive: boolean;
  liveStreamId: string | null;
  isFollowing?: boolean;
  isChannelMember?: boolean;
  liveAlertsOn?: boolean;
  hasStore?: boolean;
  socialLinks: Array<{ label: string; url: string; sortOrder: number }>;
};

export type CreatorVideoItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  type: string;
  channel: string;
  channelSlug: string;
};

export type CreatorStoreSummary = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  bannerUrl: string | null;
  shippingFree: boolean;
  shippingFeeUsd: number;
  isPublished: boolean;
  createdAt: string;
};

export type PublicStoreProduct = {
  id: string;
  productType: 'merchandise' | 'digital' | 'ticket' | 'course';
  title: string;
  description: string | null;
  priceUsd: number;
  imageUrl: string | null;
  galleryUrls: string[];
  inventory: number | null;
  inventoryUnlimited: boolean;
  inStock: boolean;
  shippingFree?: boolean;
  shippingFeeUsd?: number;
  createdAt: string;
};

export type SellerStoreProduct = {
  id: string;
  productType: 'merchandise' | 'digital' | 'ticket' | 'course';
  title: string;
  description: string | null;
  priceUsd: number;
  imageUrl: string | null;
  galleryUrls: string[];
  digitalUrl: string | null;
  inventory: number | null;
  inventoryUnlimited: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  isPaid?: boolean;
  entryCoinCost?: number | null;
  entryPriceUsd?: number | null;
};

export type PodcastShow = {
  id: string;
  title: string;
  coverUrl: string | null;
  creatorName: string;
  hostAvatar?: string | null;
  episodeCount: number;
  category: string;
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
  episodeNumber?: number;
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

export type VideoCreator = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type VideoDetail = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  hlsMasterUrl: string | null;
  playbackUrl: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  likesCount: number;
  commentsCount?: number;
  type: string;
  category?: string | null;
  releaseYear?: number | null;
  ageRating?: string | null;
  tagline?: string | null;
  liked?: boolean;
  saved?: boolean;
  disliked?: boolean;
  isFollowing?: boolean;
  status?: string;
  creator: VideoCreator;
};

export type VideoComment = {
  id: string;
  body: string;
  likesCount: number;
  liked?: boolean;
  createdAt: string;
  user: VideoCreator;
  replies?: VideoComment[];
};

export type PodcastEpisodeDetail = {
  id: string;
  showId: string;
  title: string;
  description?: string | null;
  coverUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  mediaType: 'audio' | 'video';
  durationSeconds: number;
  playsCount?: number;
  liked?: boolean;
  saved?: boolean;
  disliked?: boolean;
  show?: { id: string; title: string; coverUrl?: string | null };
  creator?: VideoCreator;
};

export type VerticalSeriesDetail = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  genre: string | null;
  description: string | null;
  totalEpisodes: number;
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    thumbnailUrl: string | null;
    durationSeconds: number;
    cliffhanger: string | null;
  }>;
  creator: VideoCreator | null;
};

export type VerticalEpisodePlayback = {
  series: {
    id: string;
    slug: string;
    title: string;
    creatorId: string | null;
    posterUrl?: string | null;
    saved?: boolean;
  };
  episode: {
    id: string;
    episodeNumber: number;
    title: string;
    videoUrl: string | null;
    hlsMasterUrl?: string | null;
    playbackUrl?: string | null;
    durationSeconds: number;
    cliffhanger: string | null;
    viewsCount?: number;
    likesCount?: number;
    liked?: boolean;
    saved?: boolean;
    disliked?: boolean;
  };
  nextEpisode: { episodeNumber: number; title: string } | null;
};

export type PlaylistItemDetail = {
  playlistItemId?: string;
  id: string;
  itemType: string;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  href: string;
};

export type PlaylistDetail = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  type: string;
  visibility?: string;
  itemCount: number;
  creatorSlug: string;
  creatorName: string;
  items: PlaylistItemDetail[];
};
