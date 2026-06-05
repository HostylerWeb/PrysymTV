/** Mock data for admin UI review — replace with API calls in phase 2. */

export const MOCK_OVERVIEW = {
  dau: 1842,
  liveNow: 2,
  liveViewers: 347,
  revenueTodayUsd: 1247.5,
  pendingReports: 12,
  pendingPayouts: 3,
  pendingPayoutsUsd: 4250,
}

export const MOCK_REPORTS = [
  {
    id: "rpt-001",
    status: "pending" as const,
    targetType: "video",
    targetTitle: "Late Night Gaming Stream Highlights",
    targetId: "vid-8a2f",
    reason: "harassment",
    reporter: "@viewer_jane",
    createdAt: "2026-06-01T10:22:00Z",
  },
  {
    id: "rpt-002",
    status: "pending" as const,
    targetType: "comment",
    targetTitle: "Comment on Summer Concert Replay",
    targetId: "cmt-44b1",
    reason: "spam",
    reporter: "@mod_bot",
    createdAt: "2026-06-01T09:05:00Z",
  },
  {
    id: "rpt-003",
    status: "reviewed" as const,
    targetType: "stream",
    targetTitle: "Community Town Hall Live",
    targetId: "str-991c",
    reason: "other",
    reporter: "@citizen_one",
    createdAt: "2026-05-31T18:40:00Z",
  },
]

export const MOCK_USERS = [
  {
    id: "usr-1",
    username: "creator_alex",
    displayName: "Alex Rivera",
    email: "alex@example.com",
    role: "creator",
    isVerified: true,
    isBanned: false,
    streamerStatus: "approved",
    partnerTier: "partner",
    coins: 1200,
    joinedAt: "2025-11-12",
  },
  {
    id: "usr-2",
    username: "new_streamer",
    displayName: "Jordan Lee",
    email: "jordan@example.com",
    role: "user",
    isVerified: false,
    isBanned: false,
    streamerStatus: "pending",
    partnerTier: "standard",
    coins: 50,
    joinedAt: "2026-05-28",
  },
  {
    id: "usr-3",
    username: "banned_user",
    displayName: "Spam Account",
    email: "spam@bad.net",
    role: "user",
    isVerified: false,
    isBanned: true,
    streamerStatus: "none",
    partnerTier: "standard",
    coins: 0,
    joinedAt: "2026-04-02",
  },
]

export const MOCK_STREAMER_APPS = [
  {
    id: "app-1",
    username: "new_streamer",
    displayName: "Jordan Lee",
    description: "I host weekly sports commentary and local event coverage.",
    status: "pending" as const,
    submittedAt: "2026-05-29T14:00:00Z",
    hasIdDocument: true,
  },
  {
    id: "app-2",
    username: "edu_creator",
    displayName: "Maya Chen",
    description: "Educational STEM workshops for youth programs.",
    status: "pending" as const,
    submittedAt: "2026-05-30T09:30:00Z",
    hasIdDocument: true,
  },
]

export const MOCK_LIVE_STREAMS = [
  {
    id: "str-live-1",
    title: "Friday Night Hoops — Live Commentary",
    creator: "@sports_host",
    viewers: 214,
    category: "Sports",
    startedAt: "2026-06-01T19:00:00Z",
  },
  {
    id: "str-live-2",
    title: "Acoustic Session — Downtown Plaza",
    creator: "@concert_live",
    viewers: 133,
    category: "Concerts",
    startedAt: "2026-06-01T20:15:00Z",
  },
]

export const MOCK_PAYOUTS = [
  {
    id: "pay-1",
    creator: "@creator_alex",
    amountUsd: 2500,
    method: "paypal" as const,
    status: "requested" as const,
    taxStatus: "approved",
    createdAt: "2026-05-31T11:00:00Z",
  },
  {
    id: "pay-2",
    creator: "@podcast_pro",
    amountUsd: 850,
    method: "bank_transfer" as const,
    status: "requested" as const,
    taxStatus: "not_submitted",
    createdAt: "2026-06-01T08:20:00Z",
  },
]

export const MOCK_CAMPAIGNS = [
  {
    id: "ad-1",
    title: "Community Bank — Home Banner",
    advertiserName: "First Community Bank",
    placement: "home_banner",
    budgetUsd: 5000,
    delivered: 42000,
    target: 100000,
    clicks: 890,
    status: "active" as const,
    startsAt: "2026-05-01",
    endsAt: "2026-06-30",
  },
  {
    id: "ad-2",
    title: "University Open House",
    advertiserName: "Metro State U",
    placement: "shorts_interstitial",
    budgetUsd: 2500,
    delivered: 98000,
    target: 100000,
    clicks: 1204,
    status: "active" as const,
    startsAt: "2026-05-15",
    endsAt: "2026-07-15",
  },
]

export const MOCK_REVENUE_RULES = [
  {
    ruleKey: "live_event",
    name: "Live event / ticket / PPV",
    creatorBps: 8000,
    platformBps: 1500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: "viewer_support",
    name: "Viewer support (tips, gifts)",
    creatorBps: 9000,
    platformBps: 500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: "insider_membership",
    name: "Platform Insider ($4.99/mo)",
    creatorBps: 0,
    platformBps: 8000,
    gafBps: 1000,
    creatorDevFundBps: 1000,
  },
  {
    ruleKey: "ad_gaf_allocation",
    name: "Advertising → GAF",
    creatorBps: 0,
    platformBps: 9500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
]

export const MOCK_LEDGER_BATCHES = [
  {
    id: "batch-1",
    ruleKey: "viewer_support",
    sourceType: "gift",
    grossUsd: 4.99,
    creatorId: "usr-1",
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "batch-2",
    ruleKey: "coin_purchase",
    sourceType: "coin_purchase",
    grossUsd: 9.99,
    creatorId: null,
    createdAt: "2026-06-01T11:30:00Z",
  },
]

export const MOCK_COIN_PACKAGES = [
  { id: "starter", coins: 100, priceUsd: 0.99, label: "Starter", isActive: true },
  { id: "popular", coins: 500, priceUsd: 4.99, label: "Popular", isActive: true },
  { id: "mega", coins: 5000, priceUsd: 29.99, label: "Mega", isActive: true },
]

export const MOCK_GIFTS = [
  { id: "rose", name: "Rose", coinCost: 10, animationKey: "rose", isActive: true },
  { id: "fire", name: "Fire", coinCost: 50, animationKey: "fire", isActive: true },
  { id: "crown", name: "Crown", coinCost: 500, animationKey: "crown", isActive: true },
]

export const MOCK_PROGRAM_CATEGORIES = [
  { slug: "general", label: "General", vertical: "general", sortOrder: 0, isActive: true },
  { slug: "sports", label: "Sports", vertical: "sports", sortOrder: 1, isActive: true },
  { slug: "concerts", label: "Concerts", vertical: "concert", sortOrder: 2, isActive: true },
  { slug: "community", label: "Community", vertical: "community_event", sortOrder: 3, isActive: true },
  { slug: "education", label: "Education", vertical: "education", sortOrder: 4, isActive: true },
]

export const MOCK_MODULE_SCORECARD = [
  { module: 1, name: "Creator Management", percent: 70, notes: "Streamer apply + profiles done" },
  { module: 2, name: "Revenue Distribution", percent: 40, notes: "Engine + gifts wired" },
  { module: 3, name: "Advertising", percent: 50, notes: "Serve/track + admin campaigns" },
  { module: 6, name: "Donation & Tip Engine", percent: 25, notes: "Gifts only" },
  { module: 8, name: "Impact Dashboard", percent: 30, notes: "UI shell, data pipeline TBD" },
]

export const MOCK_GAF_PROGRAMS = [
  { id: "gaf-1", category: "economic", title: "Economic development", isActive: true },
  { id: "gaf-2", category: "workforce", title: "Workforce development", isActive: true },
  { id: "gaf-3", category: "housing", title: "Housing initiatives", isActive: true },
  { id: "gaf-4", category: "youth", title: "Youth development", isActive: true },
]

export type ContentVideoType = "video" | "short" | "movie"

export const MOCK_VIDEOS = [
  {
    id: "vid-8a2f",
    title: "Late Night Gaming Stream Highlights",
    type: "video" as ContentVideoType,
    creatorId: "usr-1",
    creator: "@creator_alex",
    views: 12400,
    likes: 892,
    comments: 156,
    status: "published" as const,
    category: "Sports",
    uploadedAt: "2026-05-28T14:00:00Z",
    siteHref: "/watch/vid-8a2f",
  },
  {
    id: "vid-2b91",
    title: "Summer Concert Replay — Full Set",
    type: "video" as ContentVideoType,
    creatorId: "usr-1",
    creator: "@creator_alex",
    views: 45200,
    likes: 3201,
    comments: 412,
    status: "published" as const,
    category: "Concerts",
    uploadedAt: "2026-05-20T18:30:00Z",
    siteHref: "/watch/vid-2b91",
  },
  {
    id: "shrt-001",
    title: "Quick tip: camera angles",
    type: "short" as ContentVideoType,
    creatorId: "usr-2",
    creator: "@new_streamer",
    views: 8900,
    likes: 445,
    comments: 23,
    status: "published" as const,
    category: "Education",
    uploadedAt: "2026-05-30T09:00:00Z",
    siteHref: "/shorts/shrt-001",
  },
  {
    id: "shrt-002",
    title: "Game-winning buzzer beater",
    type: "short" as ContentVideoType,
    creatorId: "usr-1",
    creator: "@creator_alex",
    views: 22100,
    likes: 1890,
    comments: 89,
    status: "published" as const,
    category: "Sports",
    uploadedAt: "2026-05-29T22:15:00Z",
    siteHref: "/shorts/shrt-002",
  },
  {
    id: "mov-001",
    title: "Downtown Documentary",
    type: "movie" as ContentVideoType,
    creatorId: "usr-1",
    creator: "@creator_alex",
    views: 5600,
    likes: 312,
    comments: 45,
    status: "published" as const,
    category: "Community",
    uploadedAt: "2026-05-15T12:00:00Z",
    siteHref: "/watch/mov-001",
  },
  {
    id: "vid-pending",
    title: "Unreviewed upload — flagged",
    type: "video" as ContentVideoType,
    creatorId: "usr-3",
    creator: "@banned_user",
    views: 12,
    likes: 0,
    comments: 2,
    status: "processing" as const,
    category: "General",
    uploadedAt: "2026-06-01T08:00:00Z",
    siteHref: "/watch/vid-pending",
  },
]

export const MOCK_VERTICAL_SERIES = [
  {
    slug: "city-stories",
    title: "City Stories",
    creatorId: "usr-1",
    creator: "@creator_alex",
    episodeCount: 8,
    totalViews: 34000,
    status: "published" as const,
    vertical: "community_event",
  },
  {
    slug: "hoops-highlights",
    title: "Hoops Highlights",
    creatorId: "usr-1",
    creator: "@creator_alex",
    episodeCount: 12,
    totalViews: 89000,
    status: "published" as const,
    vertical: "sports",
  },
  {
    slug: "stem-lab",
    title: "STEM Lab",
    creatorId: "usr-2",
    creator: "@new_streamer",
    episodeCount: 3,
    totalViews: 2100,
    status: "draft" as const,
    vertical: "education",
  },
]

export const MOCK_VERTICAL_EPISODES: Record<
  string,
  {
    id: string
    title: string
    episodeNumber: number
    views: number
    likes: number
    comments: number
    status: string
    uploadedAt: string
    siteHref: string
  }[]
> = {
  "city-stories": [
    {
      id: "vep-01",
      title: "Episode 1 — Opening night",
      episodeNumber: 1,
      views: 5200,
      likes: 210,
      comments: 34,
      status: "published",
      uploadedAt: "2026-05-10T10:00:00Z",
      siteHref: "/verticals/community_event/city-stories/vep-01",
    },
    {
      id: "vep-02",
      title: "Episode 2 — Main street",
      episodeNumber: 2,
      views: 4100,
      likes: 189,
      comments: 28,
      status: "published",
      uploadedAt: "2026-05-17T10:00:00Z",
      siteHref: "/verticals/community_event/city-stories/vep-02",
    },
  ],
  "hoops-highlights": [
    {
      id: "vep-h01",
      title: "Week 1 recap",
      episodeNumber: 1,
      views: 12000,
      likes: 890,
      comments: 112,
      status: "published",
      uploadedAt: "2026-05-01T10:00:00Z",
      siteHref: "/verticals/sports/hoops-highlights/vep-h01",
    },
  ],
  "stem-lab": [
    {
      id: "vep-s01",
      title: "Intro to circuits",
      episodeNumber: 1,
      views: 800,
      likes: 45,
      comments: 6,
      status: "draft",
      uploadedAt: "2026-05-25T10:00:00Z",
      siteHref: "/verticals/education/stem-lab/vep-s01",
    },
  ],
}

export const MOCK_PODCAST_SHOWS = [
  {
    id: "pod-show-1",
    title: "Community Voices",
    creatorId: "usr-1",
    creator: "@creator_alex",
    episodeCount: 24,
    subscribers: 1200,
    status: "published" as const,
  },
  {
    id: "pod-show-2",
    title: "Sports Desk Daily",
    creatorId: "usr-2",
    creator: "@new_streamer",
    episodeCount: 6,
    subscribers: 340,
    status: "published" as const,
  },
]

export const MOCK_PODCAST_EPISODES: Record<
  string,
  {
    id: string
    title: string
    durationMin: number
    plays: number
    likes: number
    comments: number
    status: string
    publishedAt: string
    siteHref: string
  }[]
> = {
  "pod-show-1": [
    {
      id: "pep-101",
      title: "Interview with local mayor",
      durationMin: 42,
      plays: 890,
      likes: 67,
      comments: 12,
      status: "published",
      publishedAt: "2026-05-28T08:00:00Z",
      siteHref: "/podcasts/pod-show-1/pep-101",
    },
    {
      id: "pep-102",
      title: "Small business spotlight",
      durationMin: 35,
      plays: 654,
      likes: 45,
      comments: 8,
      status: "published",
      publishedAt: "2026-05-21T08:00:00Z",
      siteHref: "/podcasts/pod-show-1/pep-102",
    },
  ],
  "pod-show-2": [
    {
      id: "pep-201",
      title: "Playoff preview",
      durationMin: 28,
      plays: 1200,
      likes: 98,
      comments: 22,
      status: "published",
      publishedAt: "2026-05-30T06:00:00Z",
      siteHref: "/podcasts/pod-show-2/pep-201",
    },
  ],
}

export const MOCK_COMMENTS = [
  {
    id: "cmt-44b1",
    body: "Check out my channel for free coins!!!",
    author: "@spam_bot_99",
    targetType: "video",
    targetTitle: "Summer Concert Replay",
    targetId: "vid-2b91",
    likes: 0,
    reports: 3,
    status: "visible" as const,
    createdAt: "2026-05-31T16:00:00Z",
  },
  {
    id: "cmt-88a2",
    body: "Great breakdown of the play!",
    author: "@viewer_jane",
    targetType: "short",
    targetTitle: "Game-winning buzzer beater",
    targetId: "shrt-002",
    likes: 12,
    reports: 0,
    status: "visible" as const,
    createdAt: "2026-05-30T20:00:00Z",
  },
  {
    id: "cmt-hidden",
    body: "[Removed by moderator]",
    author: "@banned_user",
    targetType: "vertical_episode",
    targetTitle: "Week 1 recap",
    targetId: "vep-h01",
    likes: 0,
    reports: 1,
    status: "hidden" as const,
    createdAt: "2026-05-29T12:00:00Z",
  },
]

export const MOCK_TRANSACTIONS = [
  {
    id: "txn-001",
    type: "coin_purchase" as const,
    user: "@viewer_jane",
    amountUsd: 4.99,
    coins: 500,
    status: "completed" as const,
    createdAt: "2026-06-01T11:30:00Z",
  },
  {
    id: "txn-002",
    type: "gift_send" as const,
    user: "@viewer_jane",
    recipient: "@creator_alex",
    giftName: "Crown",
    coinCost: 500,
    amountUsd: null,
    status: "completed" as const,
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "txn-003",
    type: "payout" as const,
    user: "@creator_alex",
    amountUsd: 2500,
    status: "requested" as const,
    createdAt: "2026-05-31T11:00:00Z",
  },
  {
    id: "txn-004",
    type: "coin_purchase" as const,
    user: "@new_streamer",
    amountUsd: 0.99,
    coins: 100,
    status: "completed" as const,
    createdAt: "2026-05-30T09:15:00Z",
  },
  {
    id: "txn-005",
    type: "insider_subscription" as const,
    user: "@viewer_jane",
    amountUsd: 4.99,
    status: "completed" as const,
    createdAt: "2026-05-29T14:00:00Z",
  },
]

export const MOCK_GIFT_SENDS = [
  {
    id: "gift-send-1",
    giftName: "Rose",
    coinCost: 10,
    sender: "@viewer_jane",
    recipient: "@creator_alex",
    context: "live",
    contextTitle: "Friday Night Hoops",
    createdAt: "2026-06-01T19:45:00Z",
  },
  {
    id: "gift-send-2",
    giftName: "Crown",
    coinCost: 500,
    sender: "@viewer_jane",
    recipient: "@creator_alex",
    context: "video",
    contextTitle: "Late Night Gaming Highlights",
    createdAt: "2026-06-01T12:00:00Z",
  },
  {
    id: "gift-send-3",
    giftName: "Fire",
    coinCost: 50,
    sender: "@new_streamer",
    recipient: "@creator_alex",
    context: "short",
    contextTitle: "Game-winning buzzer beater",
    createdAt: "2026-05-30T21:00:00Z",
  },
]

export const MOCK_CONTENT_STATS = {
  videos: MOCK_VIDEOS.filter((v) => v.type === "video").length,
  shorts: MOCK_VIDEOS.filter((v) => v.type === "short").length,
  movies: MOCK_VIDEOS.filter((v) => v.type === "movie").length,
  verticalSeries: MOCK_VERTICAL_SERIES.length,
  verticalEpisodes: Object.values(MOCK_VERTICAL_EPISODES).flat().length,
  podcastShows: MOCK_PODCAST_SHOWS.length,
  podcastEpisodes: Object.values(MOCK_PODCAST_EPISODES).flat().length,
  comments: MOCK_COMMENTS.length,
  totalViews: MOCK_VIDEOS.reduce((s, v) => s + v.views, 0),
}

export const MOCK_USER_CONTENT: Record<
  string,
  { type: string; title: string; id: string; views: number; status: string }[]
> = {
  "usr-1": [
    { type: "video", title: "Late Night Gaming Stream Highlights", id: "vid-8a2f", views: 12400, status: "published" },
    { type: "short", title: "Game-winning buzzer beater", id: "shrt-002", views: 22100, status: "published" },
    { type: "vertical", title: "City Stories (8 eps)", id: "city-stories", views: 34000, status: "published" },
    { type: "podcast", title: "Community Voices (24 eps)", id: "pod-show-1", views: 1544, status: "published" },
  ],
  "usr-2": [
    { type: "short", title: "Quick tip: camera angles", id: "shrt-001", views: 8900, status: "published" },
    { type: "vertical", title: "STEM Lab (3 eps)", id: "stem-lab", views: 2100, status: "draft" },
  ],
  "usr-3": [
    { type: "video", title: "Unreviewed upload — flagged", id: "vid-pending", views: 12, status: "processing" },
  ],
}

export const MOCK_USER_FINANCIAL: Record<
  string,
  {
    balanceUsd: number
    lifetimeEarningsUsd: number
    coins: number
    payouts: { id: string; amountUsd: number; status: string; date: string }[]
    giftsReceived: { gift: string; from: string; coins: number; date: string }[]
  }
> = {
  "usr-1": {
    balanceUsd: 1240,
    lifetimeEarningsUsd: 8420,
    coins: 1200,
    payouts: [
      { id: "pay-1", amountUsd: 2500, status: "requested", date: "2026-05-31" },
      { id: "pay-0", amountUsd: 1800, status: "completed", date: "2026-04-15" },
    ],
    giftsReceived: [
      { gift: "Crown", from: "@viewer_jane", coins: 500, date: "2026-06-01" },
      { gift: "Rose", from: "@viewer_jane", coins: 10, date: "2026-06-01" },
    ],
  },
  "usr-2": {
    balanceUsd: 0,
    lifetimeEarningsUsd: 45,
    coins: 50,
    payouts: [],
    giftsReceived: [],
  },
  "usr-3": {
    balanceUsd: 0,
    lifetimeEarningsUsd: 0,
    coins: 0,
    payouts: [],
    giftsReceived: [],
  },
}

export const MOCK_USER_REPORTS: Record<
  string,
  {
    filed: { id: string; target: string; reason: string; status: string; date: string }[]
    received: { id: string; target: string; reason: string; status: string; date: string }[]
  }
> = {
  "usr-1": {
    filed: [],
    received: [
      { id: "rpt-010", target: "Late Night Gaming Highlights", reason: "copyright", status: "dismissed", date: "2026-05-20" },
    ],
  },
  "usr-2": { filed: [], received: [] },
  "usr-3": {
    filed: [],
    received: [
      { id: "rpt-001", target: "Unreviewed upload", reason: "harassment", status: "pending", date: "2026-06-01" },
    ],
  },
}

export function getVideosByType(type: ContentVideoType) {
  return MOCK_VIDEOS.filter((v) => v.type === type)
}
