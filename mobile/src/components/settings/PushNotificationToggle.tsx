import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import {
  handlePushToggle,
  loadPushPreference,
} from '@/lib/push-notifications';
import { colors } from '@/theme/tokens';

type Props = {
  /** Shown in a highlighted card when true (settings notifications panel). */
  featured?: boolean;
  description?: string;
};

export function PushNotificationToggle({
  featured = false,
  description = 'Get alerts for live streams, likes, comments, and new uploads — even when Prysym TV is in the background.',
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadPushPreference()
      .then((state) => {
        if (!cancelled) setEnabled(state.enabled);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggle = useCallback(async (next: boolean) => {
    if (busy) return;
    if (!next) {
      setEnabled(false);
      setBusy(true);
      try {
        await handlePushToggle(false);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const granted = await handlePushToggle(true);
      setEnabled(granted);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const content = (
    <View style={[styles.row, featured && styles.rowFeatured]}>
      <View style={styles.copy}>
        <Text style={styles.label}>Push notifications</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {loading || busy ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Switch
          value={enabled}
          onValueChange={(v) => void onToggle(v)}
          trackColor={{ true: colors.primary, false: colors.border }}
          disabled={busy}
        />
      )}
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFeatured: {
    borderBottomWidth: 0,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: 12,
  },
  copy: { flex: 1 },
  label: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  description: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
