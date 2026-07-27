
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ACCESS_TOKEN_KEY = "prysymtv_access_token";
const SESSION_HINT_KEY = "prysymtv_session_hint";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function markSessionHint(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  } else {
    localStorage.removeItem(SESSION_HINT_KEY);
  }
}

function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_HINT_KEY) === "1";
}

function migrateSessionHint(): void {
  if (typeof window === "undefined") return;
  if (!hasSessionHint() && localStorage.getItem(ACCESS_TOKEN_KEY)) {
    markSessionHint(true);
  }
}

function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
      exp?: number;
    };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return false;
  }
}

function migrateLegacySessionStorageToken(): void {
  if (typeof window === "undefined") return;
  const fromSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!fromSession) return;
  if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(ACCESS_TOKEN_KEY, fromSession);
  }
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!fromEnv) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return fromEnv;
}

export const ACCESS_TOKEN_STORAGE_KEY = ACCESS_TOKEN_KEY;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    markSessionHint(true);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    markSessionHint(false);
  }
}

export function loadStoredAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    migrateLegacySessionStorageToken();
    migrateSessionHint();
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  setAccessToken(data.accessToken);
  return data.accessToken;
}

function getRefreshOnce(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Restore session from refresh cookie when access token is missing or expired. */
export async function ensureAccessToken(): Promise<string | null> {
  const existing = loadStoredAccessToken();
  if (existing && !isAccessTokenExpired(existing)) return existing;
  if (!existing && !hasSessionHint()) return null;
  return getRefreshOnce();
}

/** Force a refresh using the HttpOnly session cookie. */
export async function refreshSession(): Promise<string | null> {
  return refreshAccessToken();
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
  const { method = "GET", body, auth = true, headers = {} } = options;
  const url = path.startsWith("http")
    ? path
    : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const run = async (token: string | null): Promise<Response> => {
    const reqHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    };
    if (body !== undefined) {
      reqHeaders["Content-Type"] = "application/json";
    }
    if (auth && token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
    return fetch(url, {
      method,
      credentials: "include",
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = auth ? loadStoredAccessToken() : null;
  if (auth && token && isAccessTokenExpired(token)) {
    token = null;
  }
  if (auth && !token && hasSessionHint()) {
    token = await getRefreshOnce();
  }
  let res = await run(token);

  if (res.status === 401 && auth) {
    const newToken = await getRefreshOnce();
    if (newToken) {
      token = newToken;
      res = await run(token);
    }
  }

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
    if (typeof parsed === "object" && parsed !== null && "message" in parsed) {
      const m = (parsed as { message: unknown }).message;
      if (typeof m === "string") message = m;
      else if (Array.isArray(m)) message = m.map(String).join(", ");
    }
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}
