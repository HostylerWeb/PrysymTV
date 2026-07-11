import { Prisma } from '@prisma/client';

export function coinUsdDecimal(rate: number): Prisma.Decimal {
  return new Prisma.Decimal(rate.toFixed(6));
}

/** USD purchase price for a coin package (coins × coinUsd, 2 decimal places). */
export function packagePriceFromCoins(coins: number, coinUsd: number): number {
  if (!Number.isFinite(coins) || coins <= 0) return 0;
  const rate = Number.isFinite(coinUsd) && coinUsd > 0 ? coinUsd : 0.02;
  return Math.round(coins * rate * 100) / 100;
}

/** USD list price → whole coins charged (always rounded up). */
export function usdToCoinCost(usd: number, coinUsd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  if (!Number.isFinite(coinUsd) || coinUsd <= 0) {
    return Math.ceil(usd / 0.02);
  }
  return Math.ceil(usd / coinUsd);
}

export function coinsToGrossUsd(
  coins: number,
  coinUsd: number | Prisma.Decimal,
): Prisma.Decimal {
  const rate =
    coinUsd instanceof Prisma.Decimal ? coinUsd : coinUsdDecimal(coinUsd);
  return rate.mul(coins);
}
