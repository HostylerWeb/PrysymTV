import Constants from 'expo-constants';

const PRODUCTION_API = 'https://srv1765056.hstgr.cloud/api/v1';
const PRODUCTION_WS = 'https://srv1765056.hstgr.cloud';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra?.trim()) return fromExtra.replace(/\/$/, '');
  return PRODUCTION_API;
}

export function getWsUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const api = getApiBaseUrl();
  if (api.includes('localhost') || api.includes('127.0.0.1')) {
    return api.replace(/\/api\/v1$/, '');
  }
  if (api.endsWith('/api/v1')) {
    return api.slice(0, -'/api/v1'.length);
  }
  return PRODUCTION_WS;
}

export function isApiEnabled(): boolean {
  return Boolean(getApiBaseUrl());
}

/** When true, failed auth falls back to mock user (dev UI preview only). */
export function isMockAuthEnabled(): boolean {
  return process.env.EXPO_PUBLIC_MOCK_AUTH === 'true';
}
