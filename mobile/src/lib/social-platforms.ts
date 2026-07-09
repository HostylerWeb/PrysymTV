export type SocialPlatformKey =
  | 'website'
  | 'x'
  | 'facebook'
  | 'instagram'
  | 'twitch'
  | 'tiktok'
  | 'telegram';

export type SocialPlatform = {
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  aliases: string[];
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://yoursite.com',
    aliases: ['website', 'site', 'link'],
  },
  {
    key: 'x',
    label: 'X',
    placeholder: 'https://x.com/username',
    aliases: ['x', 'twitter', 'twitter / x', 'twitter/x'],
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/username',
    aliases: ['facebook', 'fb'],
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    aliases: ['instagram', 'ig'],
  },
  {
    key: 'twitch',
    label: 'Twitch',
    placeholder: 'https://twitch.tv/username',
    aliases: ['twitch'],
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    aliases: ['tiktok', 'tik tok'],
  },
  {
    key: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/username',
    aliases: ['telegram', 'tg'],
  },
];

export type SocialLinkRecord = {
  label: string;
  url: string;
  sortOrder: number;
};

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function platformKeyFromLabel(label: string): SocialPlatformKey | null {
  const normalized = normalizeLabel(label);
  for (const platform of SOCIAL_PLATFORMS) {
    if (platform.aliases.includes(normalized) || normalizeLabel(platform.label) === normalized) {
      return platform.key;
    }
  }
  return null;
}

export function platformByKey(key: SocialPlatformKey): SocialPlatform {
  return SOCIAL_PLATFORMS.find((p) => p.key === key)!;
}

export function defaultSocialLinkFields(): Array<SocialLinkRecord & { key: SocialPlatformKey }> {
  return SOCIAL_PLATFORMS.map((platform, index) => ({
    key: platform.key,
    label: platform.label,
    url: '',
    sortOrder: index,
  }));
}

export function mergeSocialLinks(
  saved: SocialLinkRecord[] | null | undefined,
): Array<SocialLinkRecord & { key: SocialPlatformKey }> {
  const defaults = defaultSocialLinkFields();
  if (!saved?.length) return defaults;

  const byKey = new Map<SocialPlatformKey, SocialLinkRecord>();
  for (const link of saved) {
    const key = platformKeyFromLabel(link.label);
    if (!key || !link.url?.trim()) continue;
    byKey.set(key, {
      label: platformByKey(key).label,
      url: link.url.trim(),
      sortOrder: link.sortOrder,
    });
  }

  return defaults.map((field, index) => {
    const existing = byKey.get(field.key);
    return existing
      ? { ...field, url: existing.url, sortOrder: existing.sortOrder }
      : { ...field, sortOrder: index };
  });
}

export function socialLinksPayload(
  fields: Array<SocialLinkRecord & { key: SocialPlatformKey }>,
): SocialLinkRecord[] {
  return fields
    .filter((f) => f.url.trim())
    .map((f, index) => ({
      label: platformByKey(f.key).label,
      url: f.url.trim(),
      sortOrder: index,
    }));
}
