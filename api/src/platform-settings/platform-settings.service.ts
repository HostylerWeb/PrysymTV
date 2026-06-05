import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_ADS_SETTINGS,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_ECONOMY_SETTINGS,
  DEFAULT_PROGRAMS_SETTINGS,
  DEFAULT_SCORECARD_SETTINGS,
} from './platform-settings.defaults';
import {
  AdsSettings,
  AnalyticsSettings,
  EconomySettings,
  PLATFORM_SETTING_KEYS,
  ProgramConfigEntry,
  ScorecardSettings,
} from './platform-settings.types';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEconomy(): Promise<EconomySettings> {
    return this.getObject(PLATFORM_SETTING_KEYS.economy, DEFAULT_ECONOMY_SETTINGS);
  }

  async setEconomy(
    partial: Partial<EconomySettings>,
    adminId?: string,
  ): Promise<EconomySettings> {
    const current = await this.getEconomy();
    return this.setObject(PLATFORM_SETTING_KEYS.economy, { ...current, ...partial }, adminId);
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
    return this.getArray(PLATFORM_SETTING_KEYS.programs, DEFAULT_PROGRAMS_SETTINGS);
  }

  async setPrograms(
    programs: ProgramConfigEntry[],
    adminId?: string,
  ): Promise<ProgramConfigEntry[]> {
    return this.setArray(PLATFORM_SETTING_KEYS.programs, programs, adminId);
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
