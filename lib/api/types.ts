export type AuthUserResponse = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUserResponse;
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
  streamerStatus: "none" | "pending" | "approved" | "rejected";
  verticalCreatorStatus: "none" | "pending" | "approved" | "rejected";
  coinsBalance: number;
  premiumTier: string;
  premiumExpiresAt: string | null;
  createdAt: string;
  socialLinks?: unknown[];
  notificationPrefs?: unknown[];
  followersCount: number;
  followingCount: number;
  videosCount: number;
};

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

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
};

export type PaginatedVideos = {
  items: VideoRecord[];
  meta: PaginatedMeta;
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

export type PodcastEpisodeRecord = {
  id: string;
  title: string;
  coverUrl: string | null;
  durationSeconds: number;
  show?: { title: string };
};

export type VerticalEpisodeHistoryRecord = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  episodeNumber: number;
  series: { slug: string; title: string; posterUrl: string | null };
};

export type ContinueWatchingFeedItem = {
  contentType: "video" | "podcast_episode" | "vertical_episode";
  contentId: string;
  progressSeconds: number;
  completed: boolean;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
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

export type MessageResponse = {
  success: boolean;
  message?: string;
};

export type UpdateMeBody = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};
