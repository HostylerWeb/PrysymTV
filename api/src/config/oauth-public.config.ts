import { ConfigService } from '@nestjs/config';

function parseCommaList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
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
};

/** Public OAuth client IDs for web/mobile — secrets stay in api/.env only. */
export function buildPublicOAuthConfig(
  config: ConfigService,
): PublicOAuthConfig {
  const googleIds = parseCommaList(config.get<string>('GOOGLE_CLIENT_ID'));
  const appleIds = parseCommaList(config.get<string>('APPLE_CLIENT_ID'));

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
  };
}
