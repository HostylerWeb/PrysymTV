import type {
  ContinueWatchingItem,
  LiveStream,
  MeResponse,
  NotificationItem,
  PlaylistSummary,
  PodcastEpisode,
  PodcastShow,
  PublicUser,
  StoreProduct,
  VerticalSeries,
  VideoCard,
} from '@/types/api';
import { mockMoviePoster, mockThumb, mockVerticalPoster, getMoviePosterMeta, MOCK_IMAGES } from '@/lib/mock-images';

export const mockUser: MeResponse = {
  id: 'mock-user-1',
  email: 'demo@prysym.tv',
  username: 'democreator',
  displayName: 'Demo Creator',
  avatarUrl: MOCK_IMAGES.avatar[0],
  bannerUrl: MOCK_IMAGES.banner,
  bio: 'Sports analyst, cooking enthusiast, and Prysym creator.',
  role: 'user',
  isVerified: true,
  streamerStatus: 'none',
  verticalCreatorStatus: 'none',
  storeCreatorStatus: 'none',
  coinsBalance: 1250,
  premiumTier: 'none',
  premiumExpiresAt: null,
  followersCount: 4820,
  followingCount: 128,
  videosCount: 24,
};

const VIDEO_TOPICS = ['sports', 'cooking', 'education', 'crypto', 'finance', 'fitness', 'tech'] as const;

const VIDEO_TITLES = [
  'NBA Playoffs breakdown: clutch moments explained',
  '30-minute Italian pasta from scratch',
  'Excel for beginners: formulas that matter',
  'Crypto wallets explained in plain English',
  'Index funds vs ETFs: what to know first',
  'Full-body HIIT workout - no equipment',
  'Build your first app with React Native',
  'Soccer tactics: reading the press',
  'Meal prep Sunday: 5 lunches under $25',
  'Study smarter: note-taking systems that work',
  'Bitcoin halving and what it means for you',
  'Budgeting 101: the 50/30/20 rule',
];

export const mockVideos: VideoCard[] = Array.from({ length: 12 }, (_, i) => {
  const topic = VIDEO_TOPICS[i % VIDEO_TOPICS.length];
  return {
    id: `video-${i + 1}`,
    title: VIDEO_TITLES[i % VIDEO_TITLES.length],
    thumbnailUrl: mockThumb(topic, i),
    durationSeconds: 180 + i * 45,
    viewsCount: 1200 + i * 340,
    likesCount: 80 + i * 12,
    commentsCount: 10 + i,
    type: 'video',
    category: topic,
    channel: i % 2 === 0 ? 'Demo Creator' : 'Prysym Academy',
    channelSlug: i % 2 === 0 ? 'democreator' : 'prysym',
    liked: i % 4 === 0,
    saved: i % 5 === 0,
  };
});

const SHORT_TITLES = [
  'Penalty kick technique in 20 seconds',
  'One-pan garlic butter shrimp',
  'Compound interest visualized',
  'Morning stretch routine',
];

export const mockShorts: VideoCard[] = Array.from({ length: 8 }, (_, i) => ({
  id: `short-${i + 1}`,
  title: SHORT_TITLES[i % SHORT_TITLES.length],
  thumbnailUrl: mockThumb(VIDEO_TOPICS[i % VIDEO_TOPICS.length], i + 3, 720, 1280),
  durationSeconds: 15 + i * 5,
  viewsCount: 50000 + i * 8000,
  likesCount: 2000 + i * 300,
  type: 'short',
  channel: 'Demo Creator',
  channelSlug: 'democreator',
  liked: false,
}));

const MOVIE_COUNT = 10;

export const mockMovies: VideoCard[] = Array.from({ length: MOVIE_COUNT }, (_, i) => {
  const meta = getMoviePosterMeta(i);
  return {
    id: `movie-${i + 1}`,
    title: meta.title,
    thumbnailUrl: mockMoviePoster(i),
    durationSeconds: 5400 + i * 120,
    viewsCount: 89000 + i * 5000,
    likesCount: 4200 + i * 200,
    type: 'movie',
    channel: 'Prysym Films',
    channelSlug: 'prysym',
    releaseYear: meta.year,
    category: meta.genre,
    ageRating: 'PG-13',
    tagline: `Watch ${meta.title} on Prysym TV.`,
    isNew: i < 4,
  };
});

export const mockLiveStreams: LiveStream[] = [
  {
    id: 'live-1',
    title: 'Live NBA watch party - Finals Game 5',
    thumbnailUrl: mockThumb('sports', 0),
    viewerCount: 1240,
    category: 'Sports',
    streamer: 'Demo Creator',
    streamerSlug: 'democreator',
    avatarUrl: MOCK_IMAGES.avatar[0],
  },
  {
    id: 'live-2',
    title: 'Cook-along: homemade ramen from scratch',
    thumbnailUrl: mockThumb('cooking', 1),
    viewerCount: 856,
    category: 'Cooking',
    streamer: 'Chef Morgan',
    streamerSlug: 'chefmorgan',
    avatarUrl: MOCK_IMAGES.avatar[1],
  },
  {
    id: 'live-3',
    title: 'Crypto market open - daily chart review',
    thumbnailUrl: mockThumb('crypto', 2),
    viewerCount: 2103,
    category: 'Finance',
    streamer: 'BlockTalk',
    streamerSlug: 'blocktalk',
    avatarUrl: MOCK_IMAGES.avatar[2],
  },
];

export const mockPodcastShows: PodcastShow[] = [
  { id: 'show-1', title: 'Money Moves', coverUrl: mockThumb('finance', 0, 400, 400), creatorName: 'Prysym Finance', episodeCount: 48, category: 'Business' },
  { id: 'show-2', title: 'The Learning Lab', coverUrl: mockThumb('education', 1, 400, 400), creatorName: 'Prysym Academy', episodeCount: 36, category: 'Education' },
  { id: 'show-3', title: 'Kitchen Sessions', coverUrl: mockThumb('cooking', 2, 400, 400), creatorName: 'Chef Morgan', episodeCount: 22, category: 'Lifestyle' },
  { id: 'show-4', title: 'Game Day Podcast', coverUrl: mockThumb('sports', 3, 400, 400), creatorName: 'Demo Creator', episodeCount: 64, category: 'Sports' },
];

export const mockPodcastEpisodes: PodcastEpisode[] = Array.from({ length: 8 }, (_, i) => ({
  id: `podcast-ep-${i + 1}`,
  title: [
    'How to start investing with $100',
    'Study habits that actually stick',
    'Knife skills every home cook needs',
    'Trade deadline winners and losers',
  ][i % 4],
  coverUrl: mockThumb(VIDEO_TOPICS[i % VIDEO_TOPICS.length], i, 400, 400),
  durationSeconds: 2400 + i * 180,
  showTitle: mockPodcastShows[i % mockPodcastShows.length].title,
  mediaType: i % 3 === 0 ? 'video' : 'audio',
}));

const VERTICAL_TITLES = [
  'Midnight Confession',
  'Badge of Lies',
  'The Jury Room',
  'Stage of Secrets',
  'Cold Case Unit',
  'Double Identity',
  'The Informant',
  'Final Verdict',
];

const VERTICAL_GENRES = ['Crime', 'Drama', 'Thriller', 'Mystery', 'Police', 'Noir', 'Suspense', 'Acting'];

export const mockVerticals: VerticalSeries[] = Array.from({ length: 8 }, (_, i) => ({
  slug: `series-${i + 1}`,
  title: VERTICAL_TITLES[i % VERTICAL_TITLES.length],
  posterUrl: mockVerticalPoster(i),
  genre: VERTICAL_GENRES[i % VERTICAL_GENRES.length],
  episodeCount: 20 + i,
  description: 'Crime and drama micro-series with acting, police investigations, and mystery.',
}));

export const mockContinueWatching: ContinueWatchingItem[] = [
  {
    contentType: 'video',
    contentId: 'video-1',
    title: VIDEO_TITLES[0],
    thumbnailUrl: mockThumb('sports', 0),
    progressSeconds: 420,
    durationSeconds: 720,
  },
  {
    contentType: 'vertical_episode',
    contentId: 've-1',
    title: 'Trading Hearts - Ep. 5',
    thumbnailUrl: mockVerticalPoster(2),
    progressSeconds: 90,
    durationSeconds: 180,
    subtitle: 'Episode 5',
    seriesSlug: 'series-1',
  },
  {
    contentType: 'podcast_episode',
    contentId: 'podcast-ep-1',
    title: 'How to start investing with $100',
    thumbnailUrl: mockThumb('finance', 0, 400, 400),
    progressSeconds: 600,
    durationSeconds: 2400,
    subtitle: 'Money Moves',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'like',
    message: 'liked your video',
    isRead: false,
    createdAt: '2026-07-02T18:00:00Z',
    actorUsername: 'fan_one',
  },
  {
    id: 'n2',
    type: 'follow',
    message: 'started following you',
    isRead: false,
    createdAt: '2026-07-02T12:00:00Z',
    actorUsername: 'newviewer',
  },
  {
    id: 'n3',
    type: 'live',
    message: 'is live now',
    isRead: true,
    createdAt: '2026-07-01T20:00:00Z',
    actorUsername: 'blocktalk',
  },
];

export const mockPlaylists: PlaylistSummary[] = [
  { id: 'pl-1', title: 'Sports highlights', itemCount: 12, thumbnailUrl: mockThumb('sports', 1) },
  { id: 'pl-2', title: 'Finance & crypto', itemCount: 5, thumbnailUrl: mockThumb('crypto', 2) },
];

export const mockCreatorProfile: PublicUser = {
  username: 'democreator',
  displayName: 'Demo Creator',
  avatarUrl: MOCK_IMAGES.avatar[0],
  bannerUrl: MOCK_IMAGES.banner,
  bio: 'Sports, cooking, and creator economy content on Prysym TV.',
  isVerified: true,
  followersCount: 4820,
  followingCount: 128,
  videosCount: 24,
  hasStore: true,
  isFollowing: false,
  isLive: true,
  liveStreamId: 'live-1',
};

export const mockStoreProducts: StoreProduct[] = [
  {
    id: 'sp-1',
    title: 'Training Day Hoodie',
    description: 'Athletic fleece hoodie for creators and fans. Ships worldwide.',
    priceUsd: '49.99',
    imageUrl: mockThumb('sports', 0, 400, 400),
    galleryUrls: [mockThumb('sports', 0, 400, 400), mockThumb('fitness', 1, 400, 400)],
    productType: 'merchandise',
    inStock: true,
    inventory: 25,
    shippingFree: false,
    shippingFeeUsd: 5.99,
    creatorUsername: 'creator',
  },
  {
    id: 'sp-2',
    title: 'Crypto Trading Journal (PDF)',
    description: 'Digital workbook for tracking trades and risk. Instant download.',
    priceUsd: '9.99',
    imageUrl: mockThumb('crypto', 1, 400, 400),
    galleryUrls: [mockThumb('crypto', 1, 400, 400)],
    productType: 'digital',
    inStock: true,
    inventoryUnlimited: true,
    creatorUsername: 'creator',
  },
  {
    id: 'sp-3',
    title: 'Cooking Masterclass Poster',
    description: '18x24 kitchen art print - limited run of 100.',
    priceUsd: '24.99',
    imageUrl: mockThumb('cooking', 2, 400, 400),
    galleryUrls: [mockThumb('cooking', 2, 400, 400)],
    productType: 'merchandise',
    inStock: false,
    inventory: 0,
    shippingFree: true,
    creatorUsername: 'creator',
  },
];

export const mockComments = [
  { id: 'c1', author: 'viewer1', body: 'This breakdown helped so much!', likes: 12, liked: false },
  { id: 'c2', author: 'fan_two', body: 'More sports content like this please', likes: 8, liked: true },
  { id: 'c3', author: 'curious_user', body: 'What platform do you use for charts?', likes: 3, liked: false },
];

export const mockChatMessages = [
  { id: 'm1', user: 'viewer1', message: 'Great stream!' },
  { id: 'm2', user: 'mod_bot', message: 'Welcome to the watch party' },
  { id: 'm3', user: 'superfan', message: 'Lets go team!' },
];

export function getMockStoreProduct(id: string): StoreProduct | undefined {
  return mockStoreProducts.find((p) => p.id === id);
}

export function getMockVideo(id: string): VideoCard | undefined {
  return [...mockVideos, ...mockShorts, ...mockMovies].find((v) => v.id === id);
}

export function getMockVertical(slug: string): VerticalSeries | undefined {
  return mockVerticals.find((v) => v.slug === slug);
}
