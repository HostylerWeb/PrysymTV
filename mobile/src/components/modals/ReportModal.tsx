import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { postReport, type ReportReason } from '@/lib/api/reports';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'nudity', label: 'Sexual content' },
  { id: 'violence', label: 'Violence or dangerous acts' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'other', label: 'Other' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType?: string;
  targetId?: string;
};

export function ReportModal({ visible, onClose, targetType = 'video', targetId }: Props) {
  const styles = useThemedStyles(createStyles);
  const { isAuthenticated, requireAuth } = useMockAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason || !targetId) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await postReport({ targetType, targetId, reason });
      onClose();
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
      setReason(null);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Report">
      {!isAuthenticated ? (
        <>
          <Text style={styles.sub}>Sign in to submit a report.</Text>
          <Button label="Sign in" onPress={() => requireAuth(() => onClose())} />
        </>
      ) : (
        <>
          <Text style={styles.sub}>Why are you reporting this content?</Text>
          {REASONS.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.row, reason === r.id && styles.rowOn]}
              onPress={() => setReason(r.id)}
            >
              <Text style={[styles.rowText, reason === r.id && styles.rowTextOn]}>{r.label}</Text>
            </Pressable>
          ))}
          <Button
            label={submitting ? 'Submitting…' : 'Submit report'}
            disabled={!reason || submitting || !targetId}
            onPress={() => void submit()}
            style={{ marginTop: 16 }}
          />
        </>
      )}
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sub: { color: colors.mutedForeground, marginBottom: 12 },
    row: {
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    rowOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
    rowText: { color: colors.foreground, fontWeight: '600' },
    rowTextOn: { color: colors.primary },
  });
}
