import { ConfigService } from '@nestjs/config';

function parseCommaList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id) => !isPlaceholderOAuthId(id));
}

function isPlaceholderOAuthId(id: string): boolean {
  const value = id.toLowerCase();
  return (
    value.includes('your-web-client-id') ||
    value.includes('your-facebook-app-id') ||
    value.includes('your-apple') ||
    value === 'com.prysym.web' ||
    value.includes('placeholder') ||
    value.includes('example.apps.googleusercontent.com')
  );
}

export type PublicOAuthConfig = {
  google: {
    enabled: boolean;
    webClientId: string | null;
    iosClientId: string | null;
    androidClientId: string | null;
  };
  apple: {
    enabled: boolean;
    webClientId: string | null;
    iosClientId: string | null;
  };
  facebook: {
    enabled: boolean;
    appId: string | null;
  };
};

/** Public OAuth client IDs for web/mobile — secrets stay in api/.env only. */
export function buildPublicOAuthConfig(
  config: ConfigService,
): PublicOAuthConfig {
  const googleIds = parseCommaList(config.get<string>('GOOGLE_CLIENT_ID'));
  const appleIds = parseCommaList(config.get<string>('APPLE_CLIENT_ID'));
  const facebookRaw = config.get<string>('FACEBOOK_APP_ID')?.trim() || null;
  const facebookAppId =
    facebookRaw && !isPlaceholderOAuthId(facebookRaw) ? facebookRaw : null;

  return {
    google: {
      enabled: googleIds.length > 0,
      webClientId: googleIds[0] ?? null,
      iosClientId: googleIds[1] ?? null,
      androidClientId: googleIds[2] ?? null,
    },
    apple: {
      enabled: appleIds.length > 0,
      webClientId: appleIds[0] ?? null,
      iosClientId: appleIds[1] ?? appleIds[0] ?? null,
    },
    facebook: {
      enabled: Boolean(facebookAppId),
      appId: facebookAppId,
    },
  };
}
