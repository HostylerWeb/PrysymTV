import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './config';

const TOKEN_KEY = 'prysymtv_access_token';

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

let accessToken: string | null = null;

export async function loadStoredAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  accessToken = await AsyncStorage.getItem(TOKEN_KEY);
  return accessToken;
}

export async function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
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

  const token = auth ? await loadStoredAccessToken() : null;
  const reqHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };
  if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';
  if (auth && token) reqHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
