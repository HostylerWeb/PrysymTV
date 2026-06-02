
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

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!fromEnv) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return fromEnv;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem("prysymtv_access_token", token);
  } else {
    sessionStorage.removeItem("prysymtv_access_token");
  }
}

export function loadStoredAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = sessionStorage.getItem("prysymtv_access_token");
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
