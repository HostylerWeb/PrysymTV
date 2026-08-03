"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { PublicOAuthConfig } from "@/lib/api/config";
import { selectPublicAuth, usePublicConfig } from "@/lib/hooks/use-public-config";
import {
  sanitizeAppleClientId,
  sanitizeFacebookAppId,
  sanitizeGoogleClientId,
} from "@/lib/oauth-placeholders";

type OAuthConfigContextValue = {
  auth: PublicOAuthConfig | null;
  loading: boolean;
  googleWebClientId: string | null;
  appleWebClientId: string | null;
  facebookAppId: string | null;
  isOAuthAvailable: boolean;
};

const OAuthConfigContext = createContext<OAuthConfigContextValue>({
  auth: null,
  loading: true,
  googleWebClientId: null,
  appleWebClientId: null,
  facebookAppId: null,
  isOAuthAvailable: false,
});

const envGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
const envAppleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim() || null;
const envFacebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || null;

export function OAuthConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = usePublicConfig();
  const auth = data ? selectPublicAuth(data) : null;

  const value = useMemo<OAuthConfigContextValue>(() => {
    const googleWebClientId = sanitizeGoogleClientId(
      auth?.google.webClientId?.trim() || envGoogleClientId,
    );
    const appleWebClientId = sanitizeAppleClientId(
      auth?.apple.webClientId?.trim() || envAppleClientId,
    );
    const facebookAppId = sanitizeFacebookAppId(
      auth?.facebook.appId?.trim() || envFacebookAppId,
    );

    const isOAuthAvailable = Boolean(
      (auth?.google.enabled && googleWebClientId) ||
        (auth?.apple.enabled && appleWebClientId) ||
        (auth?.facebook.enabled && facebookAppId),
    );

    return {
      auth,
      loading: isLoading,
      googleWebClientId,
      appleWebClientId,
      facebookAppId,
      isOAuthAvailable,
    };
  }, [auth, isLoading]);

  return (
    <OAuthConfigContext.Provider value={value}>{children}</OAuthConfigContext.Provider>
  );
}

export function useOAuthConfig() {
  return useContext(OAuthConfigContext);
}
