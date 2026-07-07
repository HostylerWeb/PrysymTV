"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchPublicConfig,
  type PublicOAuthConfig,
} from "@/lib/api/config";

type OAuthConfigContextValue = {
  auth: PublicOAuthConfig | null;
  loading: boolean;
  googleWebClientId: string | null;
  appleWebClientId: string | null;
  isOAuthAvailable: boolean;
};

const OAuthConfigContext = createContext<OAuthConfigContextValue>({
  auth: null,
  loading: true,
  googleWebClientId: null,
  appleWebClientId: null,
  isOAuthAvailable: false,
});

const envGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
const envAppleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || null;

export function OAuthConfigProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<PublicOAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicConfig()
      .then((cfg) => {
        if (!cancelled) setAuth(cfg.auth);
      })
      .catch(() => {
        /* fall back to env below */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<OAuthConfigContextValue>(() => {
    const googleWebClientId =
      auth?.google.webClientId ?? envGoogleClientId;
    const appleWebClientId =
      auth?.apple.webClientId ?? envAppleClientId;
    const isOAuthAvailable = Boolean(
      googleWebClientId ||
        appleWebClientId ||
        auth?.google.enabled ||
        auth?.apple.enabled,
    );
    return {
      auth,
      loading,
      googleWebClientId,
      appleWebClientId,
      isOAuthAvailable,
    };
  }, [auth, loading]);

  return (
    <OAuthConfigContext.Provider value={value}>
      {children}
    </OAuthConfigContext.Provider>
  );
}

export function useOAuthConfig() {
  return useContext(OAuthConfigContext);
}
