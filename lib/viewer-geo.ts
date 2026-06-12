import { apiRequest } from "@/lib/api-client";

export type ViewerGeo = {
  city: string | null;
  region: string | null;
  regionName: string | null;
  countryCode: string | null;
};

const STORAGE_KEY = "prysym_viewer_geo";

let memoryCache: ViewerGeo | null = null;
let pending: Promise<ViewerGeo | null> | null = null;

function readStored(): ViewerGeo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ViewerGeo;
  } catch {
    return null;
  }
}

function store(geo: ViewerGeo) {
  memoryCache = geo;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(geo));
  }
}

/** Viewer city/region from our API (server IP geo). Cached per session. */
export function getViewerGeo(): Promise<ViewerGeo | null> {
  if (memoryCache) return Promise.resolve(memoryCache);

  const stored = readStored();
  if (stored) {
    memoryCache = stored;
    return Promise.resolve(stored);
  }

  if (typeof window === "undefined") return Promise.resolve(null);

  if (!pending) {
    pending = apiRequest<{ geo: ViewerGeo | null }>("/config/viewer-geo", {
      auth: false,
    })
      .then((res) => {
        const geo = res.geo;
        if (geo && (geo.city || geo.regionName || geo.countryCode)) {
          store(geo);
          return geo;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}
