import { ApiError } from '@/lib/api-client';

function getServerApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!fromEnv) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  return fromEnv;
}

export async function serverFetchJson<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const url = `${getServerApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    next: init?.revalidate !== undefined ? { revalidate: init.revalidate } : { revalidate: 60 },
  });

  const text = await res.text();
  let parsed: unknown = undefined;
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
    }
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}
