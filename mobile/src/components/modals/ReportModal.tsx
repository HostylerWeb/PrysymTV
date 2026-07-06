import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius } from '@/theme/tokens';

const REASONS = ['Spam', 'Harassment', 'Misinformation', 'Copyright', 'Other'];

type Props = { visible: boolean; onClose: () => void };

export function ReportModal({ visible, onClose }: Props) {
  const { isAuthenticated, requireAuth } = useMockAuth();
  const [reason, setReason] = useState<string | null>(null);

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
              key={r}
              style={[styles.row, reason === r && styles.rowOn]}
              onPress={() => setReason(r)}
            >
              <Text style={styles.rowText}>{r}</Text>
            </Pressable>
          ))}
          <Button label="Submit report" disabled={!reason} onPress={onClose} style={{ marginTop: 16 }} />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, marginBottom: 12 },
  row: {
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  rowText: { color: colors.foreground, fontWeight: '600' },
});
