import {
  DEFAULT_MOVIE_GENRES,
  DEFAULT_PODCAST_CATEGORIES,
} from '../categories/categories.constants';
import { PLATFORM_PROGRAMS } from '../programs/programs.constants';
import type {
  AdsSettings,
  AnalyticsSettings,
  CategoryConfigEntry,
  EconomySettings,
  ProgramConfigEntry,
  ScorecardSettings,
} from './platform-settings.types';

export const DEFAULT_ECONOMY_SETTINGS: EconomySettings = {
  minPayoutUsd: 50,
  membershipPriceUsd: 4.99,
  insiderPriceUsd: 4.99,
  premiumBasicPriceUsd: 2.99,
  premiumPriceUsd: 4.99,
  ultimatePriceUsd: 9.99,
};

export const DEFAULT_ADS_SETTINGS: AdsSettings = {
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
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  defaultRange: '30d',
  kpiVisibility: {
    dau: true,
    liveNow: true,
    revenueToday: true,
    pendingReports: true,
    pendingPayouts: true,
  },
  alertPendingReportsThreshold: 50,
};

export const DEFAULT_SCORECARD_SETTINGS: ScorecardSettings = {
  scorecardDisplay: {
    showZeroRevenueLines: 'hide',
    defaultImpactPeriod: '30d',
  },
  moduleScorecard: [
    {
      module: 1,
      name: 'Creator Management',
      percent: 70,
      notes: 'Streamer apply + profiles done',
    },
    {
      module: 2,
      name: 'Revenue Distribution',
      percent: 40,
      notes: 'Engine + gifts wired',
    },
    {
      module: 3,
      name: 'Advertising',
      percent: 50,
      notes: 'Serve/track + admin campaigns',
    },
    {
      module: 6,
      name: 'Donation & Tip Engine',
      percent: 25,
      notes: 'Gifts only',
    },
    {
      module: 8,
      name: 'Impact Dashboard',
      percent: 30,
      notes: 'UI shell, data pipeline TBD',
    },
  ],
};

export const DEFAULT_PROGRAMS_SETTINGS: ProgramConfigEntry[] = PLATFORM_PROGRAMS.map(
  (p, index) => ({
    slug: p.slug,
    label: p.label,
    vertical: p.vertical,
    description: p.description,
    href: p.href,
    isActive: true,
    sortOrder: index,
  }),
);

export const DEFAULT_PODCAST_CATEGORIES_SETTINGS: CategoryConfigEntry[] =
  DEFAULT_PODCAST_CATEGORIES;

export const DEFAULT_MOVIE_GENRES_SETTINGS: CategoryConfigEntry[] =
  DEFAULT_MOVIE_GENRES;
