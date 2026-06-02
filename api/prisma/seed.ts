import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { ContentStatus, PrismaClient, StreamStatus, VideoType } from '@prisma/client';
import * as argon2 from 'argon2';
import { Pool } from 'pg';

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
    name: 'Platform Insider Membership ($4.99/mo)',
    description: 'Stakeholder default: platform 80%, GAF 10%, creator dev fund 10%',
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

  const demoVideo =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  const demoThumb =
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop';

  const passwordHash = await argon2.hash('Demo1234!', { type: argon2.argon2id });
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

  console.log(
    'Seeded: gifts, coins, revenue rules, GAF, ads, demo user/stream/videos, vertical series.',
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
