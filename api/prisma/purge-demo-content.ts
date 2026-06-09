import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, StreamStatus } from '@prisma/client';
import { Pool } from 'pg';

/** Demo creator and content inserted by `seed.ts` when `SEED_DEMO_CONTENT` is enabled. */
export const DEMO_USERNAME = 'progamerx';
export const DEMO_EMAIL = 'progamerx@demo.prysym.tv';
export const DEMO_VERTICAL_SLUG = 'midnight-contract';
export const DEMO_PODCAST_SHOW_IDS = [
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
] as const;
export const DEMO_LIVE_STREAM_TITLE = 'Ranked grind — road to Radiant';

export async function purgeDemoContent(prisma: PrismaClient) {
  const demoUser = await prisma.user.findFirst({
    where: { OR: [{ username: DEMO_USERNAME }, { email: DEMO_EMAIL }] },
    select: { id: true, username: true },
  });

  const vertical = await prisma.verticalSeries.deleteMany({
    where: { slug: DEMO_VERTICAL_SLUG },
  });

  const podcastShows = await prisma.podcastShow.deleteMany({
    where: {
      OR: [
        { id: { in: [...DEMO_PODCAST_SHOW_IDS] } },
        ...(demoUser ? [{ creatorId: demoUser.id }] : []),
      ],
    },
  });

  let streams = 0;
  let videos = 0;
  if (demoUser) {
    const streamResult = await prisma.stream.deleteMany({
      where: { creatorId: demoUser.id },
    });
    streams = streamResult.count;

    const videoResult = await prisma.video.deleteMany({
      where: { creatorId: demoUser.id },
    });
    videos = videoResult.count;

    await prisma.user.delete({ where: { id: demoUser.id } });
  }

  // Safety: end orphaned demo live rows if the user was removed manually earlier.
  const orphanedLive = await prisma.stream.updateMany({
    where: { title: DEMO_LIVE_STREAM_TITLE, status: StreamStatus.live },
    data: { status: StreamStatus.ended, endedAt: new Date() },
  });

  return {
    removedUser: demoUser?.username ?? null,
    verticalSeries: vertical.count,
    podcastShows: podcastShows.count,
    streams,
    videos,
    orphanedLiveEnded: orphanedLive.count,
  };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const result = await purgeDemoContent(prisma);
    console.log('Demo content purge complete:', result);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
