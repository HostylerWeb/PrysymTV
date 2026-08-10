import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TvFocusButton } from '@/components/tv/TvFocusButton';
import { pollTvAuthSession, startTvAuthSession } from '@/lib/api/tv-auth';
import { setAccessToken, setRefreshToken } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme/tokens';

type Mode = 'qr' | 'email';

export default function LoginScreen() {
  const { login, refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>('qr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrStatus, setQrStatus] = useState<'waiting' | 'expired' | 'error'>('waiting');

  const pollRef = useRef<{ sessionId: string; pollToken: string } | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const beginQrSession = useCallback(async () => {
    stopPolling();
    setQrLoading(true);
    setQrStatus('waiting');
    setError(null);
    try {
      const session = await startTvAuthSession();
      setUserCode(session.userCode);
      setVerificationUrl(session.verificationUrl);
      pollRef.current = { sessionId: session.sessionId, pollToken: session.pollToken };
      const interval = session.pollIntervalMs ?? 2000;

      const pollOnce = async () => {
        const active = pollRef.current;
        if (!active) return;
        try {
          const result = await pollTvAuthSession(active.sessionId, active.pollToken);
          if (result.status === 'approved' && result.accessToken) {
            await setAccessToken(result.accessToken);
            if (result.refreshToken) await setRefreshToken(result.refreshToken);
            await refreshUser();
            stopPolling();
            return;
          }
          if (result.status === 'expired' || result.status === 'consumed') {
            setQrStatus('expired');
            stopPolling();
            return;
          }
          pollTimerRef.current = setTimeout(() => void pollOnce(), interval);
        } catch {
          setQrStatus('error');
          stopPolling();
        }
      };

      pollTimerRef.current = setTimeout(() => void pollOnce(), interval);
    } catch (err) {
      setQrStatus('error');
      setError(err instanceof Error ? err.message : 'Could not start TV sign-in');
    } finally {
      setQrLoading(false);
    }
  }, [refreshUser, stopPolling]);

  useEffect(() => {
    if (mode === 'qr') void beginQrSession();
    return () => stopPolling();
  }, [mode, beginQrSession, stopPolling]);

  const onEmailSubmit = async () => {
    setError(null);
    setEmailLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setEmailLoading(false);
    }
  };

  const qrImageUrl =
    verificationUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(verificationUrl)}`
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>PrysymTV</Text>
        <Text style={styles.subtitle}>Sign in on your TV</Text>

        <View style={styles.modeRow}>
          <Pressable
            focusable
            hasTVPreferredFocus={mode === 'qr'}
            onPress={() => setMode('qr')}
            style={({ focused }) => [
              styles.modeBtn,
              mode === 'qr' && styles.modeBtnActive,
              focused && styles.modeBtnFocused,
            ]}
          >
            <Text style={styles.modeText}>Scan QR code</Text>
          </Pressable>
          <Pressable
            focusable
            hasTVPreferredFocus={mode === 'email'}
            onPress={() => setMode('email')}
            style={({ focused }) => [
              styles.modeBtn,
              mode === 'email' && styles.modeBtnActive,
              focused && styles.modeBtnFocused,
            ]}
          >
            <Text style={styles.modeText}>Email</Text>
          </Pressable>
        </View>

        {mode === 'qr' ? (
          <View style={styles.qrBlock}>
            {qrLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : qrImageUrl ? (
              <Image source={{ uri: qrImageUrl }} style={styles.qr} resizeMode="contain" />
            ) : null}
            {userCode ? <Text style={styles.code}>Code: {userCode}</Text> : null}
            {verificationUrl ? (
              <Text style={styles.urlHint} numberOfLines={2}>
                Or visit {verificationUrl.replace(/^https?:\/\//, '')}
              </Text>
            ) : null}
            {qrStatus === 'waiting' ? (
              <Text style={styles.hint}>
                Scan the QR code with your phone, sign in on the website, and this TV will connect automatically.
              </Text>
            ) : null}
            {qrStatus === 'expired' ? (
              <TvFocusButton
                label="Code expired — get a new QR"
                onPress={() => void beginQrSession()}
                style={styles.refreshBtn}
              />
            ) : null}
            {qrStatus === 'error' ? (
              <TvFocusButton
                label="Retry QR sign-in"
                onPress={() => void beginQrSession()}
                style={styles.refreshBtn}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.emailBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              focusable
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="you@example.com"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              focusable
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={[styles.input, passwordFocused && styles.inputFocused]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="••••••••"
            />
            <TvFocusButton
              label={emailLoading ? 'Signing in…' : 'Sign in'}
              hasTVPreferredFocus
              onPress={() => void onEmailSubmit()}
              disabled={emailLoading}
              style={styles.submit}
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    borderColor: colors.primary,
  },
  modeBtnFocused: {
    borderColor: colors.focus,
    transform: [{ scale: 1.04 }],
    backgroundColor: colors.secondary,
  },
  modeText: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
  },
  qrBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  qr: {
    width: 280,
    height: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  code: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  urlHint: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshBtn: {
    minWidth: 280,
  },
  emailBlock: { gap: spacing.sm },
  label: {
    color: colors.mutedForeground,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    borderWidth: 2,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.focus,
  },
  submit: {
    marginTop: spacing.lg,
    width: '100%',
    minWidth: 0,
  },
  error: {
    color: '#ff6b6b',
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: typography.body,
  },
});
