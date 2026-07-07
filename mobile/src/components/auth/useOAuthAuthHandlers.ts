import { useCallback } from 'react';
import { useMockAuth, getAuthErrorMessage } from '@/context/MockAuthContext';

type Options = {
  onSuccess: () => void;
  setError: (message: string) => void;
  setBusy: (busy: boolean) => void;
  busy?: boolean;
};

export function useOAuthAuthHandlers({
  onSuccess,
  setError,
  setBusy,
  busy = false,
}: Options) {
  const { loginWithGoogle, loginWithApple } = useMockAuth();

  const runOAuth = useCallback(
    async (action: () => Promise<void>) => {
      if (busy) return;
      setError('');
      setBusy(true);
      try {
        await action();
        onSuccess();
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [busy, onSuccess, setBusy, setError],
  );

  const onGoogleCredential = useCallback(
    async (idToken: string) => {
      await runOAuth(() => loginWithGoogle(idToken));
    },
    [loginWithGoogle, runOAuth],
  );

  const onAppleCredential = useCallback(
    async (identityToken: string, authorizationCode?: string) => {
      await runOAuth(() => loginWithApple(identityToken, authorizationCode));
    },
    [loginWithApple, runOAuth],
  );

  const onOAuthError = useCallback(
    (message: string) => setError(message),
    [setError],
  );

  return {
    onGoogleCredential,
    onAppleCredential,
    onOAuthError,
  };
}
