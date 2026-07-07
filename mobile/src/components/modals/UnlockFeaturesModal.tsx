import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { getCreatorCapabilities, isIdentityVerified } from '@/utils/creator-capabilities';
import type { MeResponse } from '@/types/api';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

export type CreatorVerificationContext = {
  description?: string;
  portfolioUrl?: string;
  features: Array<'vertical' | 'live' | 'store'>;
};

type UnlockFeature = 'vertical' | 'live' | 'store';

type Props = {
  visible: boolean;
  user: MeResponse;
  onClose: () => void;
  onNeedVerification: (context: CreatorVerificationContext) => void;
  preselect?: UnlockFeature;
};

export function UnlockFeaturesModal({
  visible,
  user,
  onClose,
  onNeedVerification,
  preselect,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createUnlockStyles);
  const { requestCreatorAccess } = useMockAuth();
  const [selected, setSelected] = useState<Set<UnlockFeature>>(() => {
    const s = new Set<UnlockFeature>();
    if (preselect) s.add(preselect);
    return s;
  });
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const s = new Set<UnlockFeature>();
    if (preselect) s.add(preselect);
    setSelected(s);
    setDescription('');
    setError('');
    setDone(false);
    setBusy(false);
  }, [visible, preselect]);

  const verified = isIdentityVerified(user);
  const caps = getCreatorCapabilities(user);

  const allOptions: Array<{
    id: UnlockFeature;
    label: string;
    allowed: boolean;
    pending: boolean;
  }> = [
    {
      id: 'vertical',
      label: 'Vertical series',
      allowed: caps.find((c) => c.id === 'verticals')?.allowed ?? false,
      pending: user.verticalCreatorStatus === 'pending',
    },
    {
      id: 'live',
      label: 'Live streaming',
      allowed: caps.find((c) => c.id === 'live')?.allowed ?? false,
      pending: user.streamerStatus === 'pending',
    },
    {
      id: 'store',
      label: 'Creator Store',
      allowed: user.storeCreatorStatus === 'approved',
      pending: user.storeCreatorStatus === 'pending',
    },
  ];
  const lockedOptions = allOptions.filter((o) => !o.allowed);

  const toggle = (id: UnlockFeature) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const needsLive = selected.has('live') && user.streamerStatus !== 'approved';
  const needsVertical = selected.has('vertical') && user.verticalCreatorStatus !== 'approved';
  const needsStore = selected.has('store');
  const needsIdVerification = !verified && (needsLive || needsVertical);

  const nextStepHint = verified
    ? needsStore && !needsLive && !needsVertical
      ? 'Store requests are reviewed by our team before you can list products.'
      : 'Selected features unlock immediately where eligible; store access is reviewed by admin.'
    : needsIdVerification
      ? 'Next step: upload a government-issued ID. The same document is used for all selected permissions.'
      : needsStore
        ? 'Store requests are submitted for admin review.'
        : null;

  const handleSubmit = async () => {
    if (!selected.size) return;
    const desc = description.trim() || undefined;
    setBusy(true);
    setError('');
    try {
      if (verified || needsStore) {
        const res = await requestCreatorAccess({
          features: Array.from(selected),
          description: desc,
          acceptedStoreTerms: selected.has('store') ? true : undefined,
        });
        if (
          res.results?.live === 'needs_id_verification' ||
          res.results?.vertical === 'needs_id_verification'
        ) {
          onClose();
          onNeedVerification({
            description: desc,
            features: Array.from(selected).filter((f) => {
              if (f === 'store') return false;
              if (f === 'live' && user.streamerStatus === 'approved') return false;
              if (f === 'vertical' && user.verticalCreatorStatus === 'approved') return false;
              return true;
            }),
          });
          return;
        }
        setDone(true);
        return;
      }

      if (needsIdVerification) {
        onClose();
        onNeedVerification({
          description: desc,
          features: [
            ...(needsVertical ? (['vertical'] as const) : []),
            ...(needsLive ? (['live'] as const) : []),
            ...(needsStore ? (['store'] as const) : []),
          ],
        });
        return;
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const title = verified ? 'Unlock features' : 'Request permissions';

  if (done) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="Request submitted">
        <View style={styles.success}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          <Text style={styles.successTitle}>Request submitted</Text>
          <Text style={styles.sub}>
            {selected.has('store')
              ? 'We will review your Creator Store request. Other approved features are available on your profile.'
              : 'Approved features are now available on your profile.'}
          </Text>
        </View>
        <Button label="Done" onPress={onClose} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {verified && (
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.verifiedText}>ID verified — instant unlock where eligible</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {lockedOptions.length === 0 ? (
        <Text style={styles.hint}>You already have access to all creator features.</Text>
      ) : (
        lockedOptions.map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.row, selected.has(opt.id) && styles.rowOn, opt.pending && styles.rowPending]}
            onPress={() => !opt.pending && toggle(opt.id)}
            disabled={opt.pending}
          >
            <View style={[styles.checkbox, selected.has(opt.id) && styles.checkboxOn]}>
              {selected.has(opt.id) ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{opt.label}</Text>
              <Text style={styles.rowHint}>
                {opt.pending
                  ? 'Application pending review'
                  : opt.id === 'store'
                    ? 'Admin review required'
                    : verified
                      ? 'Instant unlock'
                      : 'Requires ID verification'}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {selected.has('store') && (
        <Text style={styles.storeTerms}>
          By requesting Creator Store access, you confirm you have read our Terms of Service and
          Community Guidelines. Illegal products or services will result in an immediate account ban.
        </Text>
      )}

      {nextStepHint ? <Text style={styles.hintBox}>{nextStepHint}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder={
          verified
            ? 'Optional note for your unlock request'
            : 'What will you create? (used for your application)'
        }
        placeholderTextColor={colors.mutedForeground}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
      />

      <Button
        label={
          busy
            ? 'Submitting…'
            : verified
              ? 'Unlock selected'
              : needsIdVerification
                ? 'Continue to ID verification'
                : 'Submit request'
        }
        disabled={busy || !selected.size}
        onPress={() => void handleSubmit()}
        style={{ marginTop: 12 }}
      />
      {busy && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
    </BottomSheet>
  );
}

function createUnlockStyles(colors: ThemeColors) {
  return StyleSheet.create({
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
  },
  verifiedText: { color: colors.mutedForeground, fontSize: 13 },
  error: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: colors.destructive + '18',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  hint: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  rowPending: { opacity: 0.6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkMark: { color: colors.primaryForeground, fontSize: 12, fontWeight: '800' },
  rowLabel: { color: colors.foreground, fontWeight: '600', fontSize: 14 },
  rowHint: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  storeTerms: {
    fontSize: 11,
    color: colors.warning,
    backgroundColor: colors.warning + '18',
    borderWidth: 1,
    borderColor: colors.warning + '33',
    borderRadius: radius.md,
    padding: 10,
    lineHeight: 17,
    marginBottom: 8,
  },
  hintBox: {
    fontSize: 12,
    color: colors.mutedForeground,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 10,
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    color: colors.foreground,
    minHeight: 96,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  success: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  successTitle: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  });
}
