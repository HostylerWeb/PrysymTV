import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { ContentStatus, PrismaClient, StreamStatus, VideoType } from '@prisma/client';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import { purgeDemoContent } from './purge-demo-content';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const GIFT_CATALOG = [
  { id: 'heart', name: 'Heart', coinCost: 1, animationKey: 'heart' },
  { id: 'star', name: 'Star', coinCost: 10, animationKey: 'star' },
  { id: 'fire', name: 'Fire', coinCost: 50, animationKey: 'fire' },
  { id: 'diamond', name: 'Diamond', coinCost: 100, animationKey: 'diamond' },
  { id: 'lion', name: 'Lion', coinCost: 500, animationKey: 'lion' },
  { id: 'universe', name: 'Universe', coinCost: 1000, animationKey: 'universe' },
];

const COIN_PACKAGES = [
  { id: 'starter', coins: 100, priceUsd: 0.99, label: 'Starter', sortOrder: 1 },
  { id: 'popular', coins: 500, priceUsd: 3.99, label: 'Popular', sortOrder: 2 },
  { id: 'premium', coins: 1000, priceUsd: 6.99, label: 'Premium', sortOrder: 3 },
  { id: 'mega', coins: 5000, priceUsd: 29.99, label: 'Mega', sortOrder: 4 },
];

/** Initial DB defaults only — admins change via API; app reads from `revenue_split_rules`. */
const REVENUE_SPLIT_RULES = [
  {
    ruleKey: 'live_event',
    name: 'Live event / ticket / PPV',
    description: 'Stakeholder default: creator 80%, platform 15%, GAF 5%',
    creatorBps: 8000,
    platformBps: 1500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'viewer_support',
    name: 'Viewer support (tips, donations, super chats, gifts)',
    description: 'Stakeholder default: creator 90%, platform 5%, GAF 5%',
    creatorBps: 9000,
    platformBps: 500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'insider_membership',
    name: 'Prysym Membership (ad-free)',
    description: 'Revenue split when users subscribe to Prysym Membership. Default: platform 80%, GAF 10%, creator dev fund 10%',
    creatorBps: 0,
    platformBps: 8000,
    gafBps: 1000,
    creatorDevFundBps: 1000,
  },
  {
    ruleKey: 'ad_gaf_allocation',
    name: 'Advertising → GAF allocation',
    description: 'Share of gross ad revenue allocated to GAF (remainder stays platform)',
    creatorBps: 0,
    platformBps: 9500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'sponsorship',
    name: 'Sponsorship deals',
    description: 'Default: creator 85%, platform 10%, GAF 5% (admin-adjustable)',
    creatorBps: 8500,
    platformBps: 1000,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'creator_subscription',
    name: 'Creator channel subscriptions',
    description: 'Default: creator 90%, platform 5%, GAF 5%',
    creatorBps: 9000,
    platformBps: 500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'coin_purchase',
    name: 'Coin package purchase (platform fee)',
    description: 'Platform share when users buy coins (before spending on gifts)',
    creatorBps: 0,
    platformBps: 10000,
    gafBps: 0,
    creatorDevFundBps: 0,
  },
  {
    ruleKey: 'store_merchandise',
    name: 'Creator Store — merchandise / digital',
    description: 'Default: creator 90%, platform 5%, GAF 5%',
    creatorBps: 9000,
    platformBps: 500,
    gafBps: 500,
    creatorDevFundBps: 0,
  },
];

const GAF_PROGRAMS = [
  {
    category: 'economic' as const,
    title: 'Economic development',
    description: 'Small business grants, startup capital, equipment assistance',
  },
  {
    category: 'workforce' as const,
    title: 'Workforce development',
    description: 'Certification, job placement, apprenticeships',
  },
  {
    category: 'housing' as const,
    title: 'Housing initiatives',
    description: 'Down payment assistance, housing stabilization',
  },
  {
    category: 'youth' as const,
    title: 'Youth development',
    description: 'Trades, entrepreneurship, media training',
  },
];

function assertBpsSum(rule: (typeof REVENUE_SPLIT_RULES)[0]) {
  const sum =
    rule.creatorBps +
    rule.platformBps +
    rule.gafBps +
    rule.creatorDevFundBps;
  if (sum !== 10000) {
    throw new Error(`Split rule ${rule.ruleKey} must sum to 10000 bps, got ${sum}`);
  }
}

async function main() {
  for (const gift of GIFT_CATALOG) {
    await prisma.giftCatalog.upsert({
      where: { id: gift.id },
      create: { ...gift, isActive: true },
      update: gift,
    });
  }

  for (const pkg of COIN_PACKAGES) {
    await prisma.coinPackage.upsert({
      where: { id: pkg.id },
      create: { ...pkg, isActive: true },
      update: pkg,
    });
  }

  for (const rule of REVENUE_SPLIT_RULES) {
    assertBpsSum(rule);
    await prisma.revenueSplitRule.upsert({
      where: { ruleKey: rule.ruleKey },
      create: rule,
      update: {
        name: rule.name,
        description: rule.description,
        creatorBps: rule.creatorBps,
        platformBps: rule.platformBps,
        gafBps: rule.gafBps,
        creatorDevFundBps: rule.creatorDevFundBps,
      },
    });
  }

  for (const program of GAF_PROGRAMS) {
    const existing = await prisma.gafProgram.findFirst({
      where: { category: program.category, title: program.title },
    });
    if (!existing) {
      await prisma.gafProgram.create({ data: program });
    }
  }

  const seededPrograms = await prisma.gafProgram.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' },
  });
  const programByCategory = Object.fromEntries(
    seededPrograms.map((p) => [p.category, p]),
  ) as Record<string, (typeof seededPrograms)[0]>;

  const sampleGrants = [
    {
      category: 'economic' as const,
      amountUsd: 2500,
      description: 'Small business equipment grant — pilot cohort',
    },
    {
      category: 'workforce' as const,
      amountUsd: 1800,
      description: 'Trade certification scholarships',
    },
    {
      category: 'youth' as const,
      amountUsd: 1200,
      description: 'Youth media & entrepreneurship workshop',
    },
  ];

  for (const grant of sampleGrants) {
    const program = programByCategory[grant.category];
    const exists = await prisma.gafLedgerEntry.findFirst({
      where: {
        direction: 'outflow',
        source: 'grant',
        description: grant.description,
      },
    });
    if (!exists) {
      await prisma.gafLedgerEntry.create({
        data: {
          direction: 'outflow',
          source: 'grant',
          amountUsd: grant.amountUsd,
          programCategory: grant.category,
          gafProgramId: program?.id ?? null,
          description: grant.description,
        },
      });
    }
  }

  const now = new Date();
  const inOneYear = new Date(now);
  inOneYear.setFullYear(inOneYear.getFullYear() + 1);

  const AD_CAMPAIGNS = [
    {
      id: 'a1000000-0000-4000-8000-000000000001',
      advertiserName: 'Prysym',
      title: 'Stream the Future',
      mediaUrl:
        'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1170&auto=format&fit=crop',
      clickThroughUrl: 'https://prysym.tv',
      placement: 'home_banner' as const,
      targetImpressions: 500_000,
      budgetUsd: 5000,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000002',
      advertiserName: 'Prysym',
      title: 'Premium Headphones',
      mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      clickThroughUrl: 'https://prysym.tv',
      placement: 'shorts_interstitial' as const,
      targetImpressions: 200_000,
      budgetUsd: 3000,
    },
    {
      id: 'a1000000-0000-4000-8000-000000000003',
      advertiserName: 'Prysym',
      title: 'Prysym TV Premium',
      mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      clickThroughUrl: 'https://prysym.tv',
      placement: 'movie_preroll' as const,
      targetImpressions: 100_000,
      budgetUsd: 2500,
    },
  ];

  for (const c of AD_CAMPAIGNS) {
    await prisma.adCampaign.upsert({
      where: { id: c.id },
      create: {
        ...c,
        status: 'active',
        startsAt: now,
        endsAt: inOneYear,
      },
      update: {
        title: c.title,
        mediaUrl: c.mediaUrl,
        status: 'active',
      },
    });
  }

  await prisma.adCampaign.upsert({
    where: { id: 'a1000000-0000-4000-8000-000000000004' },
    create: {
      id: 'a1000000-0000-4000-8000-000000000004',
      advertiserName: 'Prysym',
      title: 'Next episode brought to you by Prysym',
      mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      clickThroughUrl: 'https://prysym.tv',
      placement: 'vertical_episode',
      targetImpressions: 500_000,
      budgetUsd: 4000,
      status: 'active',
      startsAt: now,
      endsAt: inOneYear,
    },
    update: { status: 'active' },
  });

  const passwordHash = await argon2.hash('Demo1234!', { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@prysym.tv',
      passwordHash,
      displayName: 'Platform Admin',
      role: 'admin',
      isVerified: true,
    },
    update: {
      role: 'admin',
      displayName: 'Platform Admin',
    },
  });

  const seedDemo = process.env.SEED_DEMO_CONTENT !== 'false';

  if (!seedDemo) {
    const purged = await purgeDemoContent(prisma);
    if (
      purged.removedUser ||
      purged.verticalSeries ||
      purged.podcastShows ||
      purged.streams ||
      purged.videos ||
      purged.orphanedLiveEnded
    ) {
      console.log('Removed leftover demo content:', purged);
    }
  }

  if (seedDemo) {
  const demoVideo =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const demoThumb =
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop';

  const progamer = await prisma.user.upsert({
    where: { username: 'progamerx' },
    create: {
      username: 'progamerx',
      email: 'progamerx@demo.prysym.tv',
      passwordHash,
      displayName: 'ProGamerX',
      role: 'creator',
      streamerStatus: 'approved',
      coinsBalance: 5000,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      isVerified: true,
    },
    update: {
      displayName: 'ProGamerX',
      streamerStatus: 'approved',
    },
  });

  const liveExists = await prisma.stream.findFirst({
    where: { creatorId: progamer.id, status: StreamStatus.live },
  });
  if (!liveExists) {
    await prisma.stream.create({
      data: {
        creatorId: progamer.id,
        title: 'Ranked grind — road to Radiant',
        category: 'Gaming',
        status: StreamStatus.live,
        thumbnailUrl: demoThumb,
        viewerCount: 12847,
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
      },
    });
  }

  const movieCount = await prisma.video.count({
    where: { type: VideoType.movie, status: ContentStatus.ready },
  });
  if (movieCount === 0) {
    await prisma.video.createMany({
      data: [
        {
          creatorId: progamer.id,
          type: VideoType.movie,
          title: 'Neon Drift',
          description: 'Street racing under neon lights.',
          thumbnailUrl: demoThumb,
          posterUrl: demoThumb,
          hlsMasterUrl: demoVideo,
          durationSeconds: 7200,
          status: ContentStatus.ready,
          viewsCount: 2400000,
          releaseYear: 2025,
          ageRating: 'PG-13',
          category: 'movies',
        },
        {
          creatorId: progamer.id,
          type: VideoType.short,
          title: 'Clutch play',
          thumbnailUrl: demoThumb,
          hlsMasterUrl: demoVideo,
          durationSeconds: 45,
          status: ContentStatus.ready,
          viewsCount: 890000,
          category: 'shorts',
        },
      ],
    });
  }

  const series = await prisma.verticalSeries.upsert({
    where: { slug: 'midnight-contract' },
    create: {
      slug: 'midnight-contract',
      title: 'Midnight Contract',
      tagline: 'Every choice has a price',
      description:
        'A 9:16 micro-drama. Bite-sized episodes end on cliffhangers — watch the next chapter after a short ad.',
      posterUrl:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop',
      bannerUrl: demoThumb,
      genre: 'Thriller',
      totalEpisodes: 5,
      status: 'published',
      creatorId: progamer.id,
    },
    update: { totalEpisodes: 5 },
  });

  const demoAudio =
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const podcastCover =
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=800&fit=crop';

  const techShow = await prisma.podcastShow.upsert({
    where: { id: 'b1000000-0000-4000-8000-000000000001' },
    create: {
      id: 'b1000000-0000-4000-8000-000000000001',
      creatorId: progamer.id,
      title: 'The Tech Horizon',
      description:
        'Weekly deep-dives into the technologies reshaping our world — AI, startups, and the future of work.',
      coverUrl: podcastCover,
      category: 'Tech',
      followersCount: 1_200_000,
      visibility: 'public',
    },
    update: { followersCount: 1_200_000 },
  });

  const crimeShow = await prisma.podcastShow.upsert({
    where: { id: 'b1000000-0000-4000-8000-000000000002' },
    create: {
      id: 'b1000000-0000-4000-8000-000000000002',
      creatorId: progamer.id,
      title: 'Crime & Consequence',
      description: 'True crime stories with investigative depth.',
      coverUrl:
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=800&fit=crop',
      category: 'True Crime',
      followersCount: 890_000,
      visibility: 'public',
    },
    update: { followersCount: 890_000 },
  });

  const podcastEpisodesSeed = [
    {
      id: 'e1000000-0000-4000-8000-000000000001',
      showId: techShow.id,
      title: 'AI & The Future of Work',
      description: 'What automation means for creators, developers, and everyday jobs.',
      playsCount: 310_000,
      durationSeconds: 4440,
      daysAgo: 2,
    },
    {
      id: 'e1000000-0000-4000-8000-000000000002',
      showId: crimeShow.id,
      title: 'The Vanishing: A 30-Year Cold Case Solved',
      description: 'New DNA evidence closes a case that haunted a small town.',
      playsCount: 142_000,
      durationSeconds: 3480,
      daysAgo: 0,
    },
    {
      id: 'e1000000-0000-4000-8000-000000000003',
      showId: techShow.id,
      title: 'Building in Public: Lessons from Year One',
      description: 'Shipping fast without burning out your community.',
      playsCount: 98_000,
      durationSeconds: 3060,
      daysAgo: 5,
    },
  ];

  for (const ep of podcastEpisodesSeed) {
    await prisma.podcastEpisode.upsert({
      where: { id: ep.id },
      create: {
        id: ep.id,
        showId: ep.showId,
        creatorId: progamer.id,
        title: ep.title,
        description: ep.description,
        coverUrl: podcastCover,
        audioUrl: demoAudio,
        durationSeconds: ep.durationSeconds,
        playsCount: ep.playsCount,
        status: ContentStatus.ready,
        visibility: 'public',
        publishedAt: new Date(Date.now() - ep.daysAgo * 86_400_000),
      },
      update: {
        status: ContentStatus.ready,
        audioUrl: demoAudio,
        playsCount: ep.playsCount,
      },
    });
  }

  for (let ep = 1; ep <= 5; ep++) {
    await prisma.verticalEpisode.upsert({
      where: {
        seriesId_episodeNumber: { seriesId: series.id, episodeNumber: ep },
      },
      create: {
        seriesId: series.id,
        episodeNumber: ep,
        title: `Episode ${ep}`,
        description: `Chapter ${ep} — the stakes rise.`,
        thumbnailUrl: demoThumb,
        videoUrl: demoVideo,
        durationSeconds: 90 + ep * 15,
        cliffhanger:
          ep < 5 ? 'She opened the door — and froze.' : 'Season finale cliffhanger.',
        status: ContentStatus.ready,
      },
      update: { status: ContentStatus.ready, videoUrl: demoVideo },
    });
  }
  }

  const platformDefaults = {
    economy: {
      minPayoutUsd: 50,
      membershipPriceUsd: 4.99,
      insiderPriceUsd: 4.99,
      premiumBasicPriceUsd: 2.99,
      premiumPriceUsd: 4.99,
      ultimatePriceUsd: 9.99,
    },
    ads: {
      shortsInterstitialEveryNSwipes: 8,
      moviePrerollSkipSeconds: 15,
      shortsSkipSeconds: 5,
      gafRuleKey: 'ad_gaf_allocation',
      impressionRevenueCpmUsd: 2.5,
      placements: {
        home_banner: true,
        shorts_interstitial: true,
        movie_preroll: true,
        vertical_episode: true,
      },
    },
    analytics: {
      defaultRange: '30d',
      kpiVisibility: {
        dau: true,
        liveNow: true,
        revenueToday: true,
        pendingReports: true,
        pendingPayouts: true,
      },
      alertPendingReportsThreshold: 50,
    },
    scorecard: {
      scorecardDisplay: {
        showZeroRevenueLines: 'hide',
        defaultImpactPeriod: '30d',
      },
      moduleScorecard: [
        { module: 1, name: 'Creator Management', percent: 70, notes: 'Streamer apply + profiles done' },
        { module: 2, name: 'Revenue Distribution', percent: 40, notes: 'Engine + gifts wired' },
        { module: 3, name: 'Advertising', percent: 50, notes: 'Serve/track + admin campaigns' },
        { module: 6, name: 'Donation & Tip Engine', percent: 25, notes: 'Gifts only' },
        { module: 8, name: 'Impact Dashboard', percent: 30, notes: 'UI shell, data pipeline TBD' },
      ],
    },
    programs: [
      { slug: 'podcasts', vertical: 'podcast', label: 'Podcasts', description: 'Shows and audio episodes from creators', href: '/podcasts', isActive: true, sortOrder: 0 },
      { slug: 'sports', vertical: 'sports', label: 'Sports', description: 'Live games, highlights, and sports talk', href: '/videos?category=sports', isActive: true, sortOrder: 1 },
      { slug: 'concerts', vertical: 'concert', label: 'Concerts', description: 'Live and on-demand concert experiences', href: '/videos?category=concerts', isActive: true, sortOrder: 2 },
      { slug: 'community', vertical: 'community_event', label: 'Community Events', description: 'Local and community programming', href: '/videos?category=community', isActive: true, sortOrder: 3 },
      { slug: 'education', vertical: 'education', label: 'Educational Programs', description: 'Courses, workshops, and learning content', href: '/videos?category=education', isActive: true, sortOrder: 4 },
      { slug: 'cooking', vertical: 'general', label: 'Cooking', description: 'Recipes, kitchen tutorials, and food culture', href: '/videos?category=cooking', isActive: true, sortOrder: 5 },
      { slug: 'coaching', vertical: 'education', label: 'Coaching', description: 'Life, career, and skills coaching from creators', href: '/videos?category=coaching', isActive: true, sortOrder: 6 },
      { slug: 'fitness', vertical: 'sports', label: 'Fitness & Wellness', description: 'Workouts, yoga, nutrition, and healthy living', href: '/videos?category=fitness', isActive: true, sortOrder: 7 },
      { slug: 'gaming', vertical: 'general', label: 'Gaming', description: 'Gameplay, esports, reviews, and gaming culture', href: '/videos?category=gaming', isActive: true, sortOrder: 8 },
      { slug: 'music', vertical: 'concert', label: 'Music', description: 'Performances, music videos, and artist content', href: '/videos?category=music', isActive: true, sortOrder: 9 },
      { slug: 'technology', vertical: 'education', label: 'Technology', description: 'Tech reviews, tutorials, and industry news', href: '/videos?category=technology', isActive: true, sortOrder: 10 },
      { slug: 'news', vertical: 'general', label: 'News & Commentary', description: 'Current events, analysis, and opinion', href: '/videos?category=news', isActive: true, sortOrder: 11 },
      { slug: 'comedy', vertical: 'general', label: 'Comedy', description: 'Stand-up, sketches, improv, and humor', href: '/videos?category=comedy', isActive: true, sortOrder: 12 },
      { slug: 'travel', vertical: 'general', label: 'Travel & Adventure', description: 'Destinations, vlogs, and outdoor exploration', href: '/videos?category=travel', isActive: true, sortOrder: 13 },
      { slug: 'fashion', vertical: 'general', label: 'Fashion & Beauty', description: 'Style, makeup, trends, and lifestyle', href: '/videos?category=fashion', isActive: true, sortOrder: 14 },
    ],
    movie_genres: [
      { slug: 'action', label: 'Action', isActive: true, sortOrder: 0 },
      { slug: 'comedy', label: 'Comedy', isActive: true, sortOrder: 1 },
      { slug: 'drama', label: 'Drama', isActive: true, sortOrder: 2 },
      { slug: 'thriller', label: 'Thriller', isActive: true, sortOrder: 3 },
      { slug: 'sci-fi', label: 'Sci-Fi', isActive: true, sortOrder: 4 },
      { slug: 'horror', label: 'Horror', isActive: true, sortOrder: 5 },
      { slug: 'romance', label: 'Romance', isActive: true, sortOrder: 6 },
      { slug: 'documentary', label: 'Documentary', isActive: true, sortOrder: 7 },
    ],
  };

  for (const [key, value] of Object.entries(platformDefaults)) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value },
      update: key === 'programs' || key === 'movie_genres' ? { value } : {},
    });
  }

  console.log(
    seedDemo
      ? 'Seeded: catalog, admin, platform settings, and demo creator content (progamerx).'
      : 'Seeded: catalog, admin, platform settings (no demo videos — SEED_DEMO_CONTENT=true to add samples).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
