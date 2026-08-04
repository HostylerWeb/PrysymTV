import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchPublicConfig,
  type PublicOAuthConfig,
} from '@/lib/api/public-config';
import {
  isPlaceholderAppleClientId,
  isPlaceholderFacebookAppId,
  isPlaceholderGoogleClientId,
} from '@/lib/oauth-mock';

type OAuthConfigContextValue = {
  auth: PublicOAuthConfig | null;
  loading: boolean;
  googleWebClientId: string | null;
  googleIosClientId: string | null;
  googleAndroidClientId: string | null;
  appleClientId: string | null;
  facebookAppId: string | null;
  isGoogleAvailableOnPlatform: boolean;
  showOAuthUi: boolean;
};

const defaultAuth: PublicOAuthConfig = {
  google: {
    enabled: false,
    webClientId: null,
    iosClientId: null,
    androidClientId: null,
  },
  apple: { enabled: false, webClientId: null, iosClientId: null },
  facebook: { enabled: false, appId: null },
};

const OAuthConfigContext = createContext<OAuthConfigContextValue>({
  auth: null,
  loading: true,
  googleWebClientId: null,
  googleIosClientId: null,
  googleAndroidClientId: null,
  appleClientId: null,
  facebookAppId: null,
  isGoogleAvailableOnPlatform: false,
  showOAuthUi: true,
});

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
        if (!cancelled) setAuth(defaultAuth);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<OAuthConfigContextValue>(() => {
    const google = auth?.google ?? defaultAuth.google;
    const apple = auth?.apple ?? defaultAuth.apple;
    const facebook = auth?.facebook ?? defaultAuth.facebook;
    const googleConfigured = Boolean(
      google.webClientId && !isPlaceholderGoogleClientId(google.webClientId),
    );
    const appleConfigured = Boolean(
      (apple.iosClientId && !isPlaceholderAppleClientId(apple.iosClientId)) ||
        (apple.webClientId && !isPlaceholderAppleClientId(apple.webClientId)),
    );
    const facebookConfigured = Boolean(
      facebook.appId && !isPlaceholderFacebookAppId(facebook.appId),
    );

    return {
      auth,
      loading,
      googleWebClientId: google.webClientId,
      googleIosClientId: google.iosClientId,
      googleAndroidClientId: google.androidClientId,
      appleClientId: apple.iosClientId ?? apple.webClientId,
      facebookAppId: facebook.appId,
      isGoogleAvailableOnPlatform: googleConfigured,
      showOAuthUi: googleConfigured || appleConfigured || facebookConfigured,
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
