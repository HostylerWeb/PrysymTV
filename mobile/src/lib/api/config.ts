import Constants from 'expo-constants';

const PRODUCTION_API = 'https://srv1765056.hstgr.cloud/api/v1';

export function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra?.trim()) return fromExtra.replace(/\/$/, '');
  return PRODUCTION_API;
}

export function isApiEnabled(): boolean {
  return Boolean(getApiBaseUrl());
}
