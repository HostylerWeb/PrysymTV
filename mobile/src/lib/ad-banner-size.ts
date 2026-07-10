export type HomeBannerSize = 'strip' | 'standard' | 'hero';

export const HOME_BANNER_SIZE_OPTIONS = [
  {
    value: 'strip' as const,
    label: 'Strip',
    description: 'Compact leaderboard strip',
    mobileHeight: 72,
  },
  {
    value: 'standard' as const,
    label: 'Standard',
    description: 'Medium-width banner',
    mobileHeight: 100,
  },
  {
    value: 'hero' as const,
    label: 'Hero',
    description: 'Taller spotlight card',
    mobileHeight: 180,
  },
];

export function resolveHomeBannerSize(size?: string | null): HomeBannerSize {
  if (size === 'standard' || size === 'hero') return size;
  return 'strip';
}

export function getHomeBannerSizeConfig(size?: string | null) {
  const resolved = resolveHomeBannerSize(size);
  return HOME_BANNER_SIZE_OPTIONS.find((option) => option.value === resolved) ?? HOME_BANNER_SIZE_OPTIONS[0];
}
