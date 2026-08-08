import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useOAuthConfig } from '@/context/OAuthConfigContext';
import {
  MOCK_APPLE_TOKEN,
  MOCK_FACEBOOK_TOKEN,
  MOCK_GOOGLE_TOKEN,
  isPlaceholderAppleClientId,
  isPlaceholderFacebookAppId,
  isPlaceholderGoogleClientId,
  shouldUseMockOAuthSignIn,
} from '@/lib/oauth-mock';
import { colors, radius } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  disabled?: boolean;
  onGoogleCredential: (idToken: string) => Promise<void>;
  onAppleCredential: (
    identityToken: string,
    authorizationCode?: string,
  ) => Promise<void>;
  onFacebookCredential: (accessToken: string) => Promise<void>;
  onError?: (message: string) => void;
  /** Show a subtle divider next to the buttons. */
  showDivider?: boolean;
  dividerLabel?: string;
  /** Place divider above (before form) or below (after form) the OAuth buttons. */
  dividerPosition?: 'above' | 'below';
  /** Use preview tokens instead of native Google/Apple flows (auth screens). */
  preferMockSignIn?: boolean;
};

function OAuthDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.divider} />
    </View>
  );
}

function OAuthPillButton({
  label,
  icon,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.oauthButton,
        (disabled || busy) && styles.oauthButtonDisabled,
        pressed && !disabled && !busy && styles.oauthButtonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.foreground} size="small" />
      ) : (
        <>
          {icon}
          <Text style={styles.oauthLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function NativeGoogleSignInButton({
  disabled,
  onGoogleCredential,
  onError,
  webClientId,
  iosClientId,
}: {
  disabled?: boolean;
  onGoogleCredential: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  webClientId?: string | null;
  iosClientId?: string | null;
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!webClientId) return;
    GoogleSignin.configure({
      webClientId,
      iosClientId: iosClientId || undefined,
      offlineAccess: false,
    });
  }, [iosClientId, webClientId]);

  const handleGoogle = useCallback(async () => {
    if (!webClientId) {
      onError?.('Google sign-in is not configured yet.');
      return;
    }
    setBusy(true);
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const result = await GoogleSignin.signIn();
      if (result.type === 'cancelled') return;
      let idToken = result.data.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }
      if (!idToken) throw new Error('Google did not return a sign-in token');
      await onGoogleCredential(idToken);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [onError, onGoogleCredential, webClientId]);

  return (
    <OAuthPillButton
      label="Continue with Google"
      icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
      busy={busy}
      disabled={disabled}
      onPress={() => void handleGoogle()}
    />
  );
}

function WebGoogleSignInButton({
  disabled,
  onGoogleCredential,
  onError,
  webClientId,
  iosClientId,
  androidClientId,
}: {
  disabled?: boolean;
  onGoogleCredential: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  webClientId?: string | null;
  iosClientId?: string | null;
  androidClientId?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
  });

  const handleGoogle = useCallback(async () => {
    if (!request) {
      onError?.('Google sign-in is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return;
      const idToken = result.params.id_token;
      if (!idToken) throw new Error('Google did not return a sign-in token');
      await onGoogleCredential(idToken);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [onError, onGoogleCredential, promptAsync, request]);

  return (
    <OAuthPillButton
      label="Continue with Google"
      icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
      busy={busy}
      disabled={disabled}
      onPress={() => void handleGoogle()}
    />
  );
}

function ConfiguredGoogleSignInButton({
  disabled,
  onGoogleCredential,
  onError,
  webClientId,
  iosClientId,
  androidClientId,
}: {
  disabled?: boolean;
  onGoogleCredential: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  webClientId?: string | null;
  iosClientId?: string | null;
  androidClientId?: string | null;
}) {
  if (Platform.OS !== 'web') {
    return (
      <NativeGoogleSignInButton
        disabled={disabled}
        onGoogleCredential={onGoogleCredential}
        onError={onError}
        webClientId={webClientId}
        iosClientId={iosClientId}
      />
    );
  }

  return (
    <WebGoogleSignInButton
      disabled={disabled}
      onGoogleCredential={onGoogleCredential}
      onError={onError}
      webClientId={webClientId}
      iosClientId={iosClientId}
      androidClientId={androidClientId}
    />
  );
}

function ConfiguredFacebookSignInButton({
  disabled,
  onFacebookCredential,
  onError,
  appId,
}: {
  disabled?: boolean;
  onFacebookCredential: (accessToken: string) => Promise<void>;
  onError?: (message: string) => void;
  appId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [request, , promptAsync] = Facebook.useAuthRequest({
    clientId: appId,
  });

  const handleFacebook = useCallback(async () => {
    if (!request) {
      onError?.('Facebook sign-in is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return;
      const accessToken = result.authentication?.accessToken;
      if (!accessToken) throw new Error('Facebook did not return a sign-in token');
      await onFacebookCredential(accessToken);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Facebook sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [onError, onFacebookCredential, promptAsync, request]);

  return (
    <OAuthPillButton
      label="Continue with Facebook"
      icon={<Ionicons name="logo-facebook" size={20} color="#1877F2" />}
      busy={busy}
      disabled={disabled}
      onPress={() => void handleFacebook()}
    />
  );
}

export function OAuthSignInButtons({
  disabled,
  onGoogleCredential,
  onAppleCredential,
  onFacebookCredential,
  onError,
  showDivider = false,
  dividerLabel = 'or',
  dividerPosition = 'below',
  preferMockSignIn = false,
}: Props) {
  const {
    loading,
    googleWebClientId,
    googleIosClientId,
    googleAndroidClientId,
    appleClientId,
    facebookAppId,
  } = useOAuthConfig();
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleNativeAvailable, setAppleNativeAvailable] = useState(false);

  const useMockSignIn = shouldUseMockOAuthSignIn({
    preferMock: preferMockSignIn,
    googleWebClientId,
    googleIosClientId,
    googleAndroidClientId,
    appleClientId,
  });

  const googleConfigured =
    preferMockSignIn && useMockSignIn
      ? true
      : Boolean(
          googleWebClientId && !isPlaceholderGoogleClientId(googleWebClientId),
        );
  const appleConfigured =
    preferMockSignIn && useMockSignIn
      ? true
      : Boolean(appleClientId && !isPlaceholderAppleClientId(appleClientId));
  const facebookConfigured =
    preferMockSignIn && useMockSignIn
      ? true
      : Boolean(facebookAppId && !isPlaceholderFacebookAppId(facebookAppId));

  const showGoogle = googleConfigured;
  const showApple = appleConfigured && Platform.OS === 'ios';
  const showFacebook = facebookConfigured;
  const canUseGoogleHook =
    !useMockSignIn && Boolean(googleWebClientId) && googleConfigured;
  const canUseFacebookHook =
    !useMockSignIn && facebookConfigured && Boolean(facebookAppId);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAppleNativeAvailable);
  }, []);

  const handleGooglePreview = useCallback(async () => {
    await onGoogleCredential(MOCK_GOOGLE_TOKEN);
  }, [onGoogleCredential]);

  const handleApplePreview = useCallback(async () => {
    await onAppleCredential(MOCK_APPLE_TOKEN);
  }, [onAppleCredential]);

  const handleFacebookPreview = useCallback(async () => {
    await onFacebookCredential(MOCK_FACEBOOK_TOKEN);
  }, [onFacebookCredential]);

  const handleAppleNative = useCallback(async () => {
    if (useMockSignIn) {
      await handleApplePreview();
      return;
    }
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
  }, [handleApplePreview, onAppleCredential, onError, useMockSignIn]);

  const useNativeAppleButton =
    Platform.OS === 'ios' &&
    appleNativeAvailable &&
    appleConfigured &&
    !useMockSignIn;
  const isBusy = disabled || appleBusy;

  if (loading) return null;
  if (!showGoogle && !showApple && !showFacebook) return null;

  return (
    <View style={styles.wrap}>
      {showDivider && dividerPosition === 'above' ? (
        <OAuthDivider label={dividerLabel} />
      ) : null}

      {showGoogle ? (
        canUseGoogleHook ? (
          <ConfiguredGoogleSignInButton
            disabled={disabled}
            onGoogleCredential={onGoogleCredential}
            onError={onError}
            webClientId={googleWebClientId}
            iosClientId={googleIosClientId}
            androidClientId={googleAndroidClientId}
          />
        ) : (
          <OAuthPillButton
            label="Continue with Google"
            icon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
            disabled={isBusy}
            onPress={() => void handleGooglePreview()}
          />
        )
      ) : null}

      {showApple ? (
        useNativeAppleButton ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={24}
            style={styles.appleNativeButton}
            onPress={() => void handleAppleNative()}
          />
        ) : (
          <OAuthPillButton
            label="Continue with Apple"
            icon={<Ionicons name="logo-apple" size={22} color={colors.foreground} />}
            busy={appleBusy}
            disabled={isBusy && !appleBusy}
            onPress={() => void handleAppleNative()}
          />
        )
      ) : null}

      {showFacebook ? (
        canUseFacebookHook && facebookAppId ? (
          <ConfiguredFacebookSignInButton
            disabled={disabled}
            onFacebookCredential={onFacebookCredential}
            onError={onError}
            appId={facebookAppId}
          />
        ) : (
          <OAuthPillButton
            label="Continue with Facebook"
            icon={<Ionicons name="logo-facebook" size={20} color="#1877F2" />}
            disabled={isBusy}
            onPress={() => void handleFacebookPreview()}
          />
        )
      ) : null}

      {showDivider && dividerPosition === 'below' ? (
        <OAuthDivider label={dividerLabel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#747775',
    backgroundColor: '#131314',
  },
  oauthButtonPressed: {
    backgroundColor: '#1f1f1f',
  },
  oauthButtonDisabled: {
    opacity: 0.55,
  },
  oauthLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  appleNativeButton: {
    width: '100%',
    height: 48,
  },
});
