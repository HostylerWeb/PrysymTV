/** Central mock data — replace with API calls during backend integration */

export type ContentCategory = "all" | "movies" | "live" | "videos" | "series" | "trending" | "podcasts"

export interface MockVideo {
  id: string
  title: string
  thumbnail: string
  duration: string
  views: string
  channel: string
  channelSlug: string
  type: "video" | "movie" | "live"
  category: ContentCategory
  videoUrl: string
  description: string
  tags: string[]
  uploadedAt: string
  likes: string
  progress?: number
}

export interface MockMovie {
  id: string
  title: string
  poster: string
  banner: string
  year: string
  rating: string
  genre: string
  genres: string[]
  duration: string
  ageRating: string
  tagline: string
  description: string
  longDescription: string
  director: string
  writers: string[]
  matchScore: string
  views: string
  videoUrl: string
  category: ContentCategory
  cast: { name: string; role: string; image: string }[]
}

export interface MockLiveStream {
  id: string
  slug: string
  title: string
  thumbnail: string
  streamer: string
  streamerSlug: string
  streamerAvatar: string
  viewers: string
  viewerCount: number
  category: string
  startedAgo: string
  description: string
}

export interface MockCreator {
  slug: string
  name: string
  username: string
  avatar: string
  banner: string
  bio: string
  subscribers: string
  totalViews: string
  videosCount: string
  isVerified: boolean
  isLive: boolean
  joinDate: string
  links: { label: string; url: string }[]
}

export interface MockPodcastShow {
  id: string
  title: string
  host: string
  hostSlug: string
  cover: string
  banner: string
  category: string
  episodes: number
  followers: string
  description: string
}

export interface MockPodcastEpisode {
  id: string
  showId: string
  podcast: string
  title: string
  duration: string
  date: string
  cover: string
  plays: string
  audioUrl: string
  description: string
}

export interface MockPlaylist {
  id: string
  title: string
  description: string
  cover: string
  creatorSlug: string
  itemCount: number
  type: "video" | "podcast" | "mixed"
  itemIds: string[]
}

export interface MockStory {
  id: string
  name: string
  slug: string
  avatar: string
  isLive?: boolean
  hasNew?: boolean
  slides: { id: string; image: string; caption?: string }[]
}

export interface MockAd {
  id: string
  placement: "home_banner" | "shorts_interstitial" | "movie_preroll"
  title: string
  mediaUrl: string
  mediaType: "image" | "video"
  clickThroughUrl: string
  skipAfterSeconds?: number
}

export const GIFT_CATALOG = [
  { id: "heart", name: "Heart", icon: "❤️", cost: 1 },
  { id: "star", name: "Star", icon: "⭐", cost: 10 },
  { id: "fire", name: "Fire", icon: "🔥", cost: 50 },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 100 },
  { id: "lion", name: "Lion", icon: "🦁", cost: 500 },
  { id: "universe", name: "Universe", icon: "🌌", cost: 1000 },
] as const

export const COIN_PACKAGES = [
  { id: "1", coins: 100, price: "$0.99", popular: false, bonus: 0 },
  { id: "2", coins: 500, price: "$3.99", popular: true, bonus: 0 },
  { id: "3", coins: 1000, price: "$6.99", popular: false, bonus: 0 },
  { id: "4", coins: 5000, price: "$29.99", popular: false, bonus: 0 },
] as const

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
const SAMPLE_MOVIE =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"

export const mockVideos: MockVideo[] = [
  {
    id: "1",
    title: "Building a $1M Business in 30 Days Challenge",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop",
    duration: "24:15",
    views: "2.3M",
    channel: "Business Minds",
    channelSlug: "business-minds",
    type: "video",
    category: "videos",
    videoUrl: SAMPLE_VIDEO,
    description: "An incredible deep dive into building a business from scratch in 30 days.",
    tags: ["#business", "#startup", "#challenge"],
    uploadedAt: "3 days ago",
    likes: "124K",
  },
  {
    id: "2",
    title: "Ultimate Guide to Minimalist Living",
    thumbnail: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=340&fit=crop",
    duration: "18:42",
    views: "890K",
    channel: "Simple Life",
    channelSlug: "simple-life",
    type: "video",
    category: "trending",
    videoUrl: SAMPLE_VIDEO,
    description: "Learn how to simplify your life and find more joy with less.",
    tags: ["#minimalism", "#lifestyle"],
    uploadedAt: "1 week ago",
    likes: "45K",
  },
  {
    id: "3",
    title: "How AI is Changing Everything in 2024",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=340&fit=crop",
    duration: "28:45",
    views: "5.2M",
    channel: "Tech Insights",
    channelSlug: "tech-insights",
    type: "video",
    category: "trending",
    videoUrl: SAMPLE_VIDEO,
    description: "A comprehensive look at AI trends reshaping every industry.",
    tags: ["#ai", "#tech", "#future"],
    uploadedAt: "2 days ago",
    likes: "892K",
  },
  {
    id: "4",
    title: "Stranger Things - Season 4",
    thumbnail: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&h=340&fit=crop",
    duration: "55:23",
    views: "12M",
    channel: "Prysym TV Originals",
    channelSlug: "prysym-originals",
    type: "video",
    category: "series",
    videoUrl: SAMPLE_VIDEO,
    description: "Continue the epic saga in Hawkins.",
    tags: ["#series", "#scifi"],
    uploadedAt: "5 days ago",
    likes: "2.1M",
    progress: 65,
  },
]

export const mockMovies: MockMovie[] = [
  {
    id: "the-last-frontier",
    title: "The Last Frontier",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop",
    year: "2024",
    rating: "9.2",
    genre: "Sci-Fi",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    duration: "2h 34m",
    ageRating: "PG-13",
    tagline: "A Journey Beyond Imagination",
    description: "An epic journey through uncharted territories where courage meets destiny.",
    longDescription:
      "In the year 2157, humanity expands across the solar system. When a mysterious signal is detected from beyond Neptune, a crew of brave explorers embarks on a perilous journey to make first contact.",
    director: "James Anderson",
    writers: ["Sarah Mitchell", "David Chen"],
    matchScore: "98%",
    views: "45.2M",
    videoUrl: SAMPLE_MOVIE,
    category: "movies",
    cast: [
      { name: "Emma Stone", role: "Captain Elena Rodriguez", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
      { name: "Michael B. Jordan", role: "Dr. Marcus Webb", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
    ],
  },
  {
    id: "1",
    title: "Interstellar",
    poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&h=800&fit=crop",
    year: "2023",
    rating: "9.0",
    genre: "Sci-Fi",
    genres: ["Sci-Fi", "Drama"],
    duration: "2h 49m",
    ageRating: "PG-13",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    description: "A team of explorers travel through a wormhole in space.",
    longDescription: "Cooper and his team venture beyond our galaxy to ensure humanity's survival.",
    director: "Christopher Nolan",
    writers: ["Jonathan Nolan", "Christopher Nolan"],
    matchScore: "96%",
    views: "38.1M",
    videoUrl: SAMPLE_MOVIE,
    category: "movies",
    cast: [
      { name: "Matthew McConaughey", role: "Cooper", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop" },
    ],
  },
  {
    id: "2",
    title: "The Dark Knight",
    poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop",
    banner: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=800&fit=crop",
    year: "2022",
    rating: "9.1",
    genre: "Action",
    genres: ["Action", "Crime", "Drama"],
    duration: "2h 32m",
    ageRating: "PG-13",
    tagline: "Welcome to a world without rules.",
    description: "Batman faces the Joker in Gotham City.",
    longDescription: "The Dark Knight must accept one of the greatest psychological tests.",
    director: "Christopher Nolan",
    writers: ["Jonathan Nolan", "Christopher Nolan"],
    matchScore: "97%",
    views: "52.4M",
    videoUrl: SAMPLE_MOVIE,
    category: "movies",
    cast: [],
  },
]

export const mockLiveStreams: MockLiveStream[] = [
  {
    id: "1",
    slug: "progamerx",
    title: "Day 100 of the Ultimate Challenge!",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=340&fit=crop",
    streamer: "ProGamerX",
    streamerSlug: "progamerx",
    streamerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    viewers: "24.5K",
    viewerCount: 24500,
    category: "Gaming",
    startedAgo: "2h ago",
    description: "Late Night Gaming Session - Playing New Release!",
  },
  {
    id: "2",
    slug: "dj-nova",
    title: "Chill Music & Chat | Late Night Vibes",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=340&fit=crop",
    streamer: "DJ_Nova",
    streamerSlug: "dj-nova",
    streamerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    viewers: "8.2K",
    viewerCount: 8200,
    category: "Music",
    startedAgo: "45m ago",
    description: "Relaxing beats and good vibes all night.",
  },
]

export const mockCreators: MockCreator[] = [
  {
    slug: "prysym-originals",
    name: "Prysym TV Originals",
    username: "@prysymtv",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=400&fit=crop",
    bio: "Official Prysym TV channel. Award-winning originals, exclusive movies, and documentaries.",
    subscribers: "12.5M",
    totalViews: "2.3B",
    videosCount: "248",
    isVerified: true,
    isLive: false,
    joinDate: "Jan 2019",
    links: [
      { label: "Website", url: "https://prysym.tv" },
      { label: "Twitter", url: "#" },
      { label: "Instagram", url: "#" },
    ],
  },
  {
    slug: "progamerx",
    name: "ProGamerX",
    username: "@progamerx",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
    bio: "Competitive gaming, challenges, and community streams every day.",
    subscribers: "2.1M",
    totalViews: "890M",
    videosCount: "1,204",
    isVerified: true,
    isLive: true,
    joinDate: "Mar 2020",
    links: [{ label: "Twitch", url: "#" }],
  },
]

export const mockPodcastShows: MockPodcastShow[] = [
  {
    id: "1",
    title: "The Tech Horizon",
    host: "Alex Rivera",
    hostSlug: "alexrivera",
    cover: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=800&fit=crop",
    banner: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&h=600&fit=crop&crop=top",
    category: "Tech",
    episodes: 248,
    followers: "1.2M",
    description: "Weekly deep-dives into the technologies reshaping our world.",
  },
]

export const mockPodcastEpisodes: MockPodcastEpisode[] = [
  {
    id: "1",
    showId: "1",
    podcast: "The Tech Horizon",
    title: "AI & The Future of Work: What Nobody Is Telling You",
    duration: "1h 14m",
    date: "2 days ago",
    cover: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop",
    plays: "310K",
    audioUrl: SAMPLE_VIDEO,
    description: "Exploring how AI will reshape careers and industries.",
  },
  {
    id: "2",
    showId: "1",
    podcast: "Crime & Consequence",
    title: "The Vanishing: A 30-Year Cold Case Solved",
    duration: "58m",
    date: "Today",
    cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop",
    plays: "142K",
    audioUrl: SAMPLE_VIDEO,
    description: "A decades-old mystery finally unraveled.",
  },
]

export const mockPlaylists: MockPlaylist[] = [
  {
    id: "1",
    title: "The Last Frontier Collection",
    description: "Everything from the epic sci-fi saga.",
    cover: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=170&fit=crop",
    creatorSlug: "prysym-originals",
    itemCount: 12,
    type: "video",
    itemIds: ["1", "3"],
  },
  {
    id: "2",
    title: "Deep Work Sessions",
    description: "Curated podcasts for focused work.",
    cover: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    creatorSlug: "prysym-originals",
    itemCount: 18,
    type: "podcast",
    itemIds: ["1", "2"],
  },
]

export const mockStories: MockStory[] = [
  {
    id: "1",
    name: "Alex Gaming",
    slug: "alex-gaming",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    isLive: true,
    slides: [
      { id: "s1", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=700&fit=crop", caption: "Live now!" },
    ],
  },
  {
    id: "2",
    name: "Sarah",
    slug: "sarah",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hasNew: true,
    slides: [
      { id: "s1", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=700&fit=crop", caption: "Japan trip highlights" },
      { id: "s2", image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=700&fit=crop" },
    ],
  },
]

export const mockAds: MockAd[] = [
  {
    id: "ad-home-1",
    placement: "home_banner",
    title: "Stream the Future",
    mediaUrl: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    mediaType: "image",
    clickThroughUrl: "https://prysym.tv",
  },
  {
    id: "ad-shorts-1",
    placement: "shorts_interstitial",
    title: "Premium Headphones",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video",
    clickThroughUrl: "https://prysym.tv",
    skipAfterSeconds: 5,
  },
  {
    id: "ad-movie-1",
    placement: "movie_preroll",
    title: "Prysym TV Premium",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaType: "video",
    clickThroughUrl: "/premium",
    skipAfterSeconds: 15,
  },
]

export const mockShorts = [
  {
    id: 1,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    username: "@gaming_pro",
    userSlug: "gaming-pro",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    caption: "Epic gaming moment! #gaming #clutch #viral",
    likes: "1.2M",
    comments: "45.2K",
    shares: "12.5K",
    saves: "89.3K",
    music: "Original Sound - gaming_pro",
    isFollowing: false,
  },
  {
    id: 2,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    username: "@travel_vibes",
    userSlug: "travel-vibes",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    caption: "Paradise found! #travel #sunset",
    likes: "856K",
    comments: "23.1K",
    shares: "8.7K",
    saves: "124K",
    music: "Sunset Lover - Petit Biscuit",
    isFollowing: true,
  },
]

// Helpers
export function getVideo(id: string) {
  return mockVideos.find((v) => v.id === id) ?? mockVideos[0]
}

export function getMovie(id: string) {
  return mockMovies.find((m) => m.id === id) ?? mockMovies[0]
}

export function getLiveStream(idOrSlug: string) {
  return (
    mockLiveStreams.find((s) => s.id === idOrSlug || s.slug === idOrSlug) ??
    mockLiveStreams[0]
  )
}

export function getCreator(slug: string) {
  return mockCreators.find((c) => c.slug === slug) ?? mockCreators[0]
}

export function getPodcastShow(id: string) {
  return mockPodcastShows.find((p) => p.id === id) ?? mockPodcastShows[0]
}

export function getPodcastEpisode(id: string) {
  return mockPodcastEpisodes.find((e) => e.id === id) ?? mockPodcastEpisodes[0]
}

export function getPlaylist(id: string) {
  return mockPlaylists.find((p) => p.id === id) ?? mockPlaylists[0]
}

export function getAd(placement: MockAd["placement"]) {
  return mockAds.find((a) => a.placement === placement)
}

export function getVideosByCategory(category: ContentCategory) {
  if (category === "all") return mockVideos
  if (category === "movies") return []
  if (category === "live") return mockVideos.filter((v) => v.type === "live")
  return mockVideos.filter((v) => v.category === category)
}

export function getSuggestedVideos(excludeId: string, limit = 4) {
  return mockVideos.filter((v) => v.id !== excludeId).slice(0, limit)
}
