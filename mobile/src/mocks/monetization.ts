/** UI mock data for monetization, advertisers, and GAF — replaced by API in Phase 2. */

export type MockAdvertiserAccount = {
  id: string;
  companyName: string;
  contactEmail: string;
  billingEmail: string | null;
  isVerified: boolean;
  campaignCount: number;
};

export type MockAdvertiserCampaign = {
  id: string;
  title: string;
  placement: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  targetImpressions: number;
  deliveredImpressions: number;
  clicks: number;
  budgetUsd: number;
  spentUsd: number;
  startsAt: string;
  endsAt: string;
};

export const mockAdvertiserAccounts: MockAdvertiserAccount[] = [
  {
    id: 'adv-demo-1',
    companyName: 'Acme Brands',
    contactEmail: 'ads@acme.com',
    billingEmail: 'billing@acme.com',
    isVerified: true,
    campaignCount: 2,
  },
];

export const mockAdvertiserPending: MockAdvertiserAccount = {
  id: 'adv-pending-1',
  companyName: 'Startup Labs',
  contactEmail: 'marketing@startuplabs.io',
  billingEmail: null,
  isVerified: false,
  campaignCount: 0,
};

export const mockAdvertiserCampaigns: Record<string, MockAdvertiserCampaign[]> = {
  'adv-demo-1': [
    {
      id: 'camp-1',
      title: 'Stream the Future',
      placement: 'home_banner',
      status: 'active',
      targetImpressions: 500_000,
      deliveredImpressions: 312_400,
      clicks: 4_820,
      budgetUsd: 5000,
      spentUsd: 1872.5,
      startsAt: '2026-06-01T00:00:00Z',
      endsAt: '2026-12-31T23:59:59Z',
    },
    {
      id: 'camp-2',
      title: 'Premium Headphones',
      placement: 'shorts_interstitial',
      status: 'active',
      targetImpressions: 200_000,
      deliveredImpressions: 98_200,
      clicks: 2_104,
      budgetUsd: 3000,
      spentUsd: 589.2,
      startsAt: '2026-06-15T00:00:00Z',
      endsAt: '2026-09-30T23:59:59Z',
    },
  ],
};

export const mockChannelMemberships = [
  {
    id: 'sub-1',
    creatorUsername: 'blocktalk',
    creatorDisplayName: 'Block Talk',
    tier: 'basic' as const,
    priceUsd: 4.99,
    currentPeriodEnd: '2026-08-01T00:00:00Z',
  },
  {
    id: 'sub-2',
    creatorUsername: 'prysym',
    creatorDisplayName: 'Prysym TV',
    tier: 'premium' as const,
    priceUsd: 9.99,
    currentPeriodEnd: '2026-07-20T00:00:00Z',
  },
];

export const mockGafTransparency = {
  summary: {
    totalInflowUsd: 128_450.75,
    totalOutflowUsd: 42_180.0,
    balanceUsd: 86_270.75,
  },
  programs: [
    {
      id: 'gaf-1',
      category: 'economic',
      title: 'Economic development',
      description: 'Small business grants, startup capital, equipment assistance',
    },
    {
      id: 'gaf-2',
      category: 'workforce',
      title: 'Workforce development',
      description: 'Certification, job placement, apprenticeships',
    },
    {
      id: 'gaf-3',
      category: 'housing',
      title: 'Housing initiatives',
      description: 'Down payment assistance, housing stabilization',
    },
    {
      id: 'gaf-4',
      category: 'youth',
      title: 'Youth development',
      description: 'Trades, entrepreneurship, media training',
    },
  ],
  fundingByCategory: [
    { category: 'economic', amountUsd: 18_500 },
    { category: 'workforce', amountUsd: 12_200 },
    { category: 'housing', amountUsd: 6_480 },
    { category: 'youth', amountUsd: 5_000 },
  ],
  recentGrants: [
    {
      id: 'grant-1',
      amountUsd: 2500,
      programTitle: 'Youth media training',
      category: 'youth',
      createdAt: '2026-06-28T00:00:00Z',
    },
    {
      id: 'grant-2',
      amountUsd: 5000,
      programTitle: 'Small business grant — Westside',
      category: 'economic',
      createdAt: '2026-06-15T00:00:00Z',
    },
    {
      id: 'grant-3',
      amountUsd: 3200,
      programTitle: 'Workforce certification cohort',
      category: 'workforce',
      createdAt: '2026-06-02T00:00:00Z',
    },
  ],
};

export const PREMIUM_PERKS = [
  'Ad-free on Shorts, Verticals, and Movies',
  'Skip movie preroll ads',
];

export const INSIDER_PERKS = [
  'Product roadmaps and early previews',
  'Insider town halls with the Prysym team',
  'Vote on platform priorities',
  'Exclusive insider community access',
];

export const MEMBERSHIP_PRICES = {
  premium: 4.99,
  insider: 4.99,
  channelBasic: 4.99,
  channelVip: 9.99,
};
