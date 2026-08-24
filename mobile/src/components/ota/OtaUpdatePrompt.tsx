import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import type { OtaUpdateState } from '@/hooks/useOtaUpdates';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function OtaUpdatePrompt({ state }: { state: OtaUpdateState }) {
  const [restarting, setRestarting] = useState(false);
  const [dismissedUpdateId, setDismissedUpdateId] = useState<string | null>(null);
  const { colors } = useTheme();

  const pendingUpdateId = state.status === 'ready' ? state.updateId : undefined;
  const dismissed = pendingUpdateId != null && dismissedUpdateId === pendingUpdateId;

  if (state.status !== 'ready' || dismissed) {
    return null;
  }

  return (
    <BottomSheet
      visible
      onClose={() => {
        if (pendingUpdateId) {
          setDismissedUpdateId(pendingUpdateId);
        }
      }}
      title="Update available"
      scroll={false}
    >
      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          A new version of PrysymTV is ready.
        </Text>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          Restart to load the latest improvements. You stay signed in.
        </Text>
        <View style={styles.actions}>
          <Button
            label="Restart now"
            loading={restarting}
            onPress={async () => {
              setRestarting(true);
              try {
                await state.onRestart();
              } finally {
                setRestarting(false);
              }
            }}
          />
          <Button
            label="Later"
            variant="secondary"
            onPress={() => {
              if (pendingUpdateId) {
                setDismissedUpdateId(pendingUpdateId);
              }
            }}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  subtitle: {
    ...typography.body,
    fontWeight: '600',
  },
  text: {
    ...typography.body,
    lineHeight: 22,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
