import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};
const googleWebClientId = extra.googleWebClientId as string | undefined;
const googleIosClientId = extra.googleIosClientId as string | undefined;
const googleAndroidClientId = extra.googleAndroidClientId as string | undefined;
const appleClientId = extra.appleClientId as string | undefined;

type Props = {
  disabled?: boolean;
  onGoogleCredential: (idToken: string) => Promise<void>;
  onAppleCredential: (
    identityToken: string,
    authorizationCode?: string,
  ) => Promise<void>;
  onError?: (message: string) => void;
};

export function isMobileOAuthConfigured(): boolean {
  return Boolean(
    googleWebClientId ||
      googleIosClientId ||
      googleAndroidClientId ||
      (Platform.OS === 'ios' && appleClientId),
  );
}

export function OAuthSignInButtons({
  disabled,
  onGoogleCredential,
  onAppleCredential,
  onError,
}: Props) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios' || !appleClientId) return;
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const handleGoogle = useCallback(async () => {
    if (!request) {
      onError?.('Google sign-in is not configured');
      return;
    }
    setGoogleBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return;
      const idToken = result.params.id_token;
      if (!idToken) throw new Error('Google did not return a sign-in token');
      await onGoogleCredential(idToken);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleBusy(false);
    }
  }, [onError, onGoogleCredential, promptAsync, request]);

  const handleApple = useCallback(async () => {
    setAppleBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('Apple did not return a sign-in token');
      }
      await onAppleCredential(
        credential.identityToken,
        credential.authorizationCode ?? undefined,
      );
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      onError?.(err instanceof Error ? err.message : 'Apple sign-in failed');
    } finally {
      setAppleBusy(false);
    }
  }, [onAppleCredential, onError]);

  const showGoogle = Boolean(
    googleWebClientId || googleIosClientId || googleAndroidClientId,
  );
  const showApple = Platform.OS === 'ios' && appleAvailable && appleClientId;

  if (!showGoogle && !showApple) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Or continue with</Text>
        <View style={styles.divider} />
      </View>

      {showGoogle ? (
        <Button
          label={googleBusy ? 'Signing in…' : 'Continue with Google'}
          variant="secondary"
          disabled={disabled || googleBusy || !request}
          onPress={() => void handleGoogle()}
        />
      ) : null}

      {showApple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={12}
          style={styles.appleButton}
          onPress={() => void handleApple()}
        />
      ) : null}

      {(googleBusy || appleBusy) && (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: {
    color: colors.mutedForeground,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  appleButton: { width: '100%', height: 48 },
  spinner: { marginTop: 4 },
});
