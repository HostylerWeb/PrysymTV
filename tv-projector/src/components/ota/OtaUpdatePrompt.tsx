import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { TvFocusButton } from '@/components/tv/TvFocusButton';
import type { OtaUpdateState } from '@/hooks/useOtaUpdates';
import { colors, spacing, typography } from '@/theme/tokens';

export function OtaUpdatePrompt({ state }: { state: OtaUpdateState }) {
  const [restarting, setRestarting] = useState(false);
  const [dismissedUpdateId, setDismissedUpdateId] = useState<string | null>(null);

  const pendingUpdateId = state.status === 'ready' ? state.updateId : undefined;
  const dismissed = pendingUpdateId != null && dismissedUpdateId === pendingUpdateId;

  if (state.status !== 'ready' || dismissed) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Update available</Text>
          <Text style={styles.subtitle}>A new version of PrysymTV is ready.</Text>
          <Text style={styles.body}>
            Restart to load the latest improvements. You stay signed in.
          </Text>
          <View style={styles.actions}>
            <TvFocusButton
              label={restarting ? 'Restarting…' : 'Restart now'}
              selected
              disabled={restarting}
              hasTVPreferredFocus
              onPress={async () => {
                setRestarting(true);
                try {
                  await state.onRestart();
                } finally {
                  setRestarting(false);
                }
              }}
            />
            <TvFocusButton
              label="Later"
              disabled={restarting}
              onPress={() => {
                if (pendingUpdateId) {
                  setDismissedUpdateId(pendingUpdateId);
                }
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
  },
  body: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    lineHeight: 30,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
