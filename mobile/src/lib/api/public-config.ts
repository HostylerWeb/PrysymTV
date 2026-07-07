import { apiRequest } from './client';
import { getApiBaseUrl } from './config';

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

export type PublicAppConfig = {
  auth: PublicOAuthConfig;
  push: {
    enabled: boolean;
    publicKey: string | null;
  };
};

export async function fetchPublicConfig(): Promise<PublicAppConfig> {
  return apiRequest<PublicAppConfig>('/config/public', { auth: false });
}

export function getApiUrlForConfig(): string {
  return getApiBaseUrl();
}
