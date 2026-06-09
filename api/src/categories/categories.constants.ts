import type { CategoryConfigEntry } from '../platform-settings/platform-settings.types';

export const DEFAULT_PODCAST_CATEGORIES: CategoryConfigEntry[] = [
  { slug: 'true-crime', label: 'True Crime', isActive: true, sortOrder: 0 },
  { slug: 'tech', label: 'Tech', isActive: true, sortOrder: 1 },
  { slug: 'business', label: 'Business', isActive: true, sortOrder: 2 },
  { slug: 'comedy', label: 'Comedy', isActive: true, sortOrder: 3 },
  { slug: 'health', label: 'Health', isActive: true, sortOrder: 4 },
  { slug: 'society', label: 'Society', isActive: true, sortOrder: 5 },
  { slug: 'science', label: 'Science', isActive: true, sortOrder: 6 },
  { slug: 'sports', label: 'Sports', isActive: true, sortOrder: 7 },
  { slug: 'music', label: 'Music', isActive: true, sortOrder: 8 },
  { slug: 'general', label: 'General', isActive: true, sortOrder: 9 },
];
