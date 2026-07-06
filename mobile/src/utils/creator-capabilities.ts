import type { MeResponse } from '@/types/api';

export type CreatorCapabilityId =
  | 'shorts'
  | 'videos'
  | 'podcasts'
  | 'verticals'
  | 'live'
  | 'store';

export type CreatorCapability = {
  id: CreatorCapabilityId;
  label: string;
  allowed: boolean;
  pending: boolean;
  description: string;
};

export function isIdentityVerified(user: MeResponse | null): boolean {
  return user?.streamerStatus === 'approved';
}

export function getCreatorCapabilities(user: MeResponse | null): CreatorCapability[] {
  if (!user) return [];
  return [
    { id: 'shorts', label: 'Shorts', allowed: true, pending: false, description: 'Vertical clips' },
    { id: 'videos', label: 'Long videos', allowed: true, pending: false, description: 'Long-form' },
    { id: 'podcasts', label: 'Podcasts', allowed: true, pending: false, description: 'Shows & audio' },
    {
      id: 'verticals',
      label: 'Vertical series',
      allowed: user.verticalCreatorStatus === 'approved',
      pending: user.verticalCreatorStatus === 'pending',
      description: 'Micro-drama',
    },
    {
      id: 'live',
      label: 'Live',
      allowed: user.streamerStatus === 'approved',
      pending: user.streamerStatus === 'pending',
      description: 'Go live',
    },
    {
      id: 'store',
      label: 'Store',
      allowed: user.storeCreatorStatus === 'approved',
      pending: user.storeCreatorStatus === 'pending',
      description: 'Sell products',
    },
  ];
}

export function hasLockedCapabilities(user: MeResponse | null): boolean {
  return getCreatorCapabilities(user).some((c) => !c.allowed);
}
