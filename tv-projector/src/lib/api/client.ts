import { getApiBaseUrl } from './config';
import { migrateLegacyTokens, secureStorage } from '@/lib/secure-storage';

const ACCESS_KEY = 'prysymtv_access_token';
const REFRESH_KEY = 'prysymtv_refresh_token';

let migrationPromise: Promise<void> | null = null;
let accessToken: string | null = null;

function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyTokens(ACCESS_KEY, REFRESH_KEY);
  }
  return migrationPromise;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function loadStoredAccessToken(): Promise<string | null> {
  await ensureMigrated();
  if (accessToken) return accessToken;
  accessToken = await secureStorage.getItem(ACCESS_KEY);
  return accessToken;
}

export async function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) await secureStorage.setItem(ACCESS_KEY, token);
  else await secureStorage.deleteItem(ACCESS_KEY);
}

export async function setRefreshToken(token: string | null) {
  if (token) await secureStorage.setItem(REFRESH_KEY, token);
  else await secureStorage.deleteItem(REFRESH_KEY);
}

export async function loadStoredRefreshToken(): Promise<string | null> {
  await ensureMigrated();
  return secureStorage.getItem(REFRESH_KEY);
}

export async function clearSessionTokens() {
  accessToken = null;
  await Promise.all([setAccessToken(null), setRefreshToken(null)]);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await loadStoredRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearSessionTokens();
    return null;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken?: string;
  };
  await setAccessToken(data.accessToken);
  if (data.refreshToken) await setRefreshToken(data.refreshToken);
  return data.accessToken;
}

let refreshPromise: Promise<string | null> | null = null;

function getRefreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Restore session when access token is missing but refresh token exists. */
export async function ensureAccessToken(): Promise<string | null> {
  const existing = await loadStoredAccessToken();
  if (existing) return existing;
  return getRefreshOnce();
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options;
  const url = path.startsWith('http')
    ? path
    : `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const doFetch = async (token: string | null) => {
    const reqHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';
    if (auth && token) reqHeaders.Authorization = `Bearer ${token}`;

    return fetch(url, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = auth ? await loadStoredAccessToken() : null;
  let res = await doFetch(token);

  if (auth && res.status === 401) {
    const next = await getRefreshOnce();
    if (next) {
      token = next;
      res = await doFetch(token);
    }
  }

  const text = await res.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const m = (parsed as { message: unknown }).message;
      if (typeof m === 'string') message = m;
      else if (Array.isArray(m)) message = m.map(String).join(', ');
    }
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
