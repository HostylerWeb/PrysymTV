import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '@/components/ui/Button';
import { AuthErrorBox, AuthFormField } from '@/components/auth/AuthFormField';
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { useOAuthAuthHandlers } from '@/components/auth/useOAuthAuthHandlers';
import { GenderField } from '@/components/auth/GenderField';
import type { UserGenderValue } from '@/lib/user-gender';
import { useMockAuth, getAuthErrorMessage } from '@/context/MockAuthContext';
import { colors, spacing, typography, radius } from '@/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useMockAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<UserGenderValue | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = () => {
    router.replace('/(tabs)/home');
  };

  const oauth = useOAuthAuthHandlers({
    onSuccess: finish,
    setError,
    setBusy,
    busy,
  });

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }
    if (!birthDate.trim()) {
      setError('Please select your date of birth.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await register(
        displayName.trim(),
        email.trim(),
        password,
        username.trim() || undefined,
        gender,
        birthDate.trim(),
      );
      finish();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
          style={styles.back}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>

        <Text style={styles.title}>Create account</Text>

        <View style={styles.form}>
          <AuthErrorBox message={error} />

          <AuthFormField
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            autoComplete="name"
            editable={!busy}
          />
          <AuthFormField
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!busy}
          />
          <AuthFormField
            value={username}
            onChangeText={(v) => setUsername(v.replace(/^@/, '').toLowerCase())}
            placeholder="Username (optional)"
            autoCapitalize="none"
            autoComplete="username"
            editable={!busy}
          />
          <AuthFormField
            value={password}
            onChangeText={setPassword}
            placeholder="Password (8+ characters)"
            secureTextEntry
            autoComplete="new-password"
            editable={!busy}
          />

          <GenderField value={gender} onChange={setGender} />

          <Text style={styles.birthLabel}>Date of birth</Text>
          <Pressable
            style={styles.birthBtn}
            onPress={() => setShowBirthPicker(true)}
            disabled={busy}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
            <Text style={{ color: birthDate ? colors.foreground : colors.mutedForeground, flex: 1 }}>
              {birthDate || 'Select date'}
            </Text>
          </Pressable>
          {showBirthPicker ? (
            <DateTimePicker
              value={birthDate ? new Date(`${birthDate}T12:00:00`) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (Platform.OS === 'android') setShowBirthPicker(false);
                if (!date) return;
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                setBirthDate(`${yyyy}-${mm}-${dd}`);
              }}
            />
          ) : null}
          {Platform.OS === 'ios' && showBirthPicker ? (
            <Button label="Done" variant="ghost" onPress={() => setShowBirthPicker(false)} />
          ) : null}

          <Button
            label={busy ? 'Creating account…' : 'Create account'}
            onPress={() => void handleRegister()}
            disabled={busy}
            size="lg"
          />
        </View>

        <View style={styles.oauth}>
          <OAuthSignInButtons
            disabled={busy}
            onGoogleCredential={oauth.onGoogleCredential}
            onAppleCredential={oauth.onAppleCredential}
            onFacebookCredential={oauth.onFacebookCredential}
            onError={oauth.onOAuthError}
            showDivider
            dividerPosition="above"
            dividerLabel="or continue with"
          />
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          disabled={busy}
          style={styles.signInRow}
        >
          <Text style={styles.signInMuted}>Already have an account? </Text>
          <Text style={styles.signInLink}>Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.page },
  back: { alignSelf: 'flex-start', marginBottom: 20 },
  title: {
    ...typography.h1,
    color: colors.foreground,
    fontSize: 28,
    marginBottom: 20,
  },
  form: { gap: 12 },
  birthLabel: { color: colors.foreground, fontSize: 13, fontWeight: '600', marginTop: 4 },
  birthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  oauth: { marginTop: 20 },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  signInMuted: { color: colors.mutedForeground, fontSize: 14 },
  signInLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
