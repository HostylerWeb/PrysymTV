import { ContentVertical } from '@prisma/client';

export type EconomySettings = {
  minPayoutUsd: number;
  insiderPriceUsd: number;
  premiumBasicPriceUsd: number;
  premiumPriceUsd: number;
  ultimatePriceUsd: number;
};

export type AdsPlacementToggles = {
  home_banner: boolean;
  shorts_interstitial: boolean;
  movie_preroll: boolean;
  vertical_episode: boolean;
};

export type AdsSettings = {
  shortsInterstitialEveryNSwipes: number;
  moviePrerollSkipSeconds: number;
  shortsSkipSeconds: number;
  gafRuleKey: string;
  placements: AdsPlacementToggles;
};

export type AnalyticsSettings = {
  defaultRange: 'today' | '7d' | '30d';
  kpiVisibility: {
    dau: boolean;
    liveNow: boolean;
    revenueToday: boolean;
    pendingReports: boolean;
    pendingPayouts: boolean;
  };
  alertPendingReportsThreshold: number;
};

export type ScorecardModuleEntry = {
  module: number;
  name: string;
  percent: number;
  notes: string;
};

export type ScorecardSettings = {
  scorecardDisplay: {
    showZeroRevenueLines: 'hide' | 'dash' | 'zero';
    defaultImpactPeriod: string;
  };
  moduleScorecard: ScorecardModuleEntry[];
};

export type ProgramConfigEntry = {
  slug: string;
  label: string;
  vertical: ContentVertical;
  description: string;
  href: string;
  isActive: boolean;
  sortOrder: number;
};

export const PLATFORM_SETTING_KEYS = {
  economy: 'economy',
  ads: 'ads',
  analytics: 'analytics',
  scorecard: 'scorecard',
  programs: 'programs',
} as const;

export type PlatformSettingKey =
  (typeof PLATFORM_SETTING_KEYS)[keyof typeof PLATFORM_SETTING_KEYS];
