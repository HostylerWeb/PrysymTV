"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useOAuthConfig } from "@/contexts/oauth-config-context";

export function OAuthProviders({ children }: { children: React.ReactNode }) {
  const { googleWebClientId, loading } = useOAuthConfig();

  if (loading && !googleWebClientId) {
    return <>{children}</>;
  }

  if (!googleWebClientId) return <>{children}</>;

  return (
    <GoogleOAuthProvider clientId={googleWebClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
