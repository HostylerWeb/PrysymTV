import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  console.log('Seeded gift catalog and coin packages.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
