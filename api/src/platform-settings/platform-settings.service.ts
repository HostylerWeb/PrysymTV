import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_ADS_SETTINGS,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_ECONOMY_SETTINGS,
  DEFAULT_MOVIE_GENRES_SETTINGS,
  DEFAULT_PODCAST_CATEGORIES_SETTINGS,
  DEFAULT_PROGRAMS_SETTINGS,
  DEFAULT_SCORECARD_SETTINGS,
} from './platform-settings.defaults';
import {
  AdsSettings,
  AnalyticsSettings,
  CategoryConfigEntry,
  EconomySettings,
  PLATFORM_SETTING_KEYS,
  ProgramConfigEntry,
  ScorecardSettings,
} from './platform-settings.types';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEconomy(): Promise<EconomySettings> {
    const raw = await this.getObject(
      PLATFORM_SETTING_KEYS.economy,
      DEFAULT_ECONOMY_SETTINGS,
    );
    const membershipPriceUsd =
      raw.membershipPriceUsd ?? raw.premiumPriceUsd ?? DEFAULT_ECONOMY_SETTINGS.membershipPriceUsd;
    return {
      ...raw,
      coinUsd: raw.coinUsd ?? DEFAULT_ECONOMY_SETTINGS.coinUsd,
      minPaidStreamUsd:
        raw.minPaidStreamUsd ?? DEFAULT_ECONOMY_SETTINGS.minPaidStreamUsd,
      membershipPriceUsd,
      premiumPriceUsd: membershipPriceUsd,
    };
  }

  async getCoinUsd(): Promise<Prisma.Decimal> {
    const economy = await this.getEconomy();
    return new Prisma.Decimal(economy.coinUsd.toFixed(6));
  }

  async setEconomy(
    partial: Partial<EconomySettings>,
    adminId?: string,
  ): Promise<EconomySettings> {
    const current = await this.getEconomy();
    const membershipPriceUsd =
      partial.membershipPriceUsd ?? partial.premiumPriceUsd ?? current.membershipPriceUsd;
    const next: EconomySettings = {
      ...current,
      ...partial,
      membershipPriceUsd,
      premiumPriceUsd: membershipPriceUsd,
    };
    return this.setObject(PLATFORM_SETTING_KEYS.economy, next, adminId);
  }

  async getMembershipPriceUsd(): Promise<number> {
    const economy = await this.getEconomy();
    return economy.membershipPriceUsd;
  }

  async getAds(): Promise<AdsSettings> {
    return this.getObject(PLATFORM_SETTING_KEYS.ads, DEFAULT_ADS_SETTINGS);
  }

  async setAds(partial: Partial<AdsSettings>, adminId?: string): Promise<AdsSettings> {
    const current = await this.getAds();
    const next: AdsSettings = {
      ...current,
      ...partial,
      placements: {
        ...current.placements,
        ...(partial.placements ?? {}),
      },
    };
    return this.setObject(PLATFORM_SETTING_KEYS.ads, next, adminId);
  }

  async getAnalytics(): Promise<AnalyticsSettings> {
    return this.getObject(PLATFORM_SETTING_KEYS.analytics, DEFAULT_ANALYTICS_SETTINGS);
  }

  async setAnalytics(
    partial: Partial<AnalyticsSettings>,
    adminId?: string,
  ): Promise<AnalyticsSettings> {
    const current = await this.getAnalytics();
    const next: AnalyticsSettings = {
      ...current,
      ...partial,
      kpiVisibility: {
        ...current.kpiVisibility,
        ...(partial.kpiVisibility ?? {}),
      },
    };
    return this.setObject(PLATFORM_SETTING_KEYS.analytics, next, adminId);
  }

  async getScorecard(): Promise<ScorecardSettings> {
    return this.getObject(PLATFORM_SETTING_KEYS.scorecard, DEFAULT_SCORECARD_SETTINGS);
  }

  async setScorecard(
    partial: Partial<ScorecardSettings>,
    adminId?: string,
  ): Promise<ScorecardSettings> {
    const current = await this.getScorecard();
    const next: ScorecardSettings = {
      scorecardDisplay: {
        ...current.scorecardDisplay,
        ...(partial.scorecardDisplay ?? {}),
      },
      moduleScorecard: partial.moduleScorecard ?? current.moduleScorecard,
    };
    return this.setObject(PLATFORM_SETTING_KEYS.scorecard, next, adminId);
  }

  async getPrograms(): Promise<ProgramConfigEntry[]> {
    const stored = await this.getArray(
      PLATFORM_SETTING_KEYS.programs,
      DEFAULT_PROGRAMS_SETTINGS,
    );
    const slugs = new Set(stored.map((p) => p.slug));
    const missing = DEFAULT_PROGRAMS_SETTINGS.filter((p) => !slugs.has(p.slug));
    if (missing.length === 0) return stored;
    return [
      ...stored,
      ...missing.map((p, i) => ({
        ...p,
        sortOrder: stored.length + i,
      })),
    ];
  }

  async setPrograms(
    programs: ProgramConfigEntry[],
    adminId?: string,
  ): Promise<ProgramConfigEntry[]> {
    return this.setArray(PLATFORM_SETTING_KEYS.programs, programs, adminId);
  }

  async getPodcastCategories(): Promise<CategoryConfigEntry[]> {
    return this.getArray(
      PLATFORM_SETTING_KEYS.podcastCategories,
      DEFAULT_PODCAST_CATEGORIES_SETTINGS,
    );
  }

  async setPodcastCategories(
    categories: CategoryConfigEntry[],
    adminId?: string,
  ): Promise<CategoryConfigEntry[]> {
    return this.setArray(PLATFORM_SETTING_KEYS.podcastCategories, categories, adminId);
  }

  async getMovieGenres(): Promise<CategoryConfigEntry[]> {
    const stored = await this.getArray(
      PLATFORM_SETTING_KEYS.movieGenres,
      DEFAULT_MOVIE_GENRES_SETTINGS,
    );
    const slugs = new Set(stored.map((g) => g.slug));
    const missing = DEFAULT_MOVIE_GENRES_SETTINGS.filter((g) => !slugs.has(g.slug));
    if (missing.length === 0) return stored;
    return [
      ...stored,
      ...missing.map((g, i) => ({
        ...g,
        sortOrder: stored.length + i,
      })),
    ];
  }

  async setMovieGenres(
    genres: CategoryConfigEntry[],
    adminId?: string,
  ): Promise<CategoryConfigEntry[]> {
    return this.setArray(PLATFORM_SETTING_KEYS.movieGenres, genres, adminId);
  }

  async getMinPayoutUsd(): Promise<number> {
    const economy = await this.getEconomy();
    return economy.minPayoutUsd;
  }

  async getPremiumPrices(): Promise<{
    basic: number;
    premium: number;
    ultimate: number;
    insider: number;
  }> {
    const economy = await this.getEconomy();
    return {
      basic: economy.premiumBasicPriceUsd,
      premium: economy.premiumPriceUsd,
      ultimate: economy.ultimatePriceUsd,
      insider: economy.insiderPriceUsd,
    };
  }

  private async getObject<T extends Record<string, unknown>>(
    key: string,
    defaults: T,
  ): Promise<T> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key } });
    if (!row?.value || typeof row.value !== 'object' || Array.isArray(row.value)) {
      return defaults;
    }
    return { ...defaults, ...(row.value as T) };
  }

  private async setObject<T extends Record<string, unknown>>(
    key: string,
    value: T,
    adminId?: string,
  ): Promise<T> {
    await this.prisma.platformSetting.upsert({
      where: { key },
      create: {
        key,
        value: value as Prisma.JsonObject,
        updatedById: adminId,
      },
      update: {
        value: value as Prisma.JsonObject,
        updatedById: adminId,
      },
    });
    return value;
  }

  private async getArray<T>(key: string, defaults: T[]): Promise<T[]> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key } });
    if (!Array.isArray(row?.value)) return defaults;
    return row.value as T[];
  }

  private async setArray<T>(key: string, value: T[], adminId?: string): Promise<T[]> {
    await this.prisma.platformSetting.upsert({
      where: { key },
      create: {
        key,
        value: value as Prisma.JsonArray,
        updatedById: adminId,
      },
      update: {
        value: value as Prisma.JsonArray,
        updatedById: adminId,
      },
    });
    return value;
  }
}
