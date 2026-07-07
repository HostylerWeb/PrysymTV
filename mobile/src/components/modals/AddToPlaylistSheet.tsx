import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockPlaylists } from '@/mocks';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  contentTitle?: string;
};

export function AddToPlaylistSheet({ visible, onClose, contentTitle }: Props) {
  const styles = useThemedStyles(createStyles);
  const { isAuthenticated, requireAuth } = useMockAuth();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Save to playlist">
      {contentTitle ? <Text style={styles.sub}>Add "{contentTitle}" to a playlist</Text> : null}
      {!isAuthenticated ? (
        <View style={styles.guestWrap}>
          <Text style={styles.guestText}>Sign in to manage playlists and save videos.</Text>
          <Button label="Sign in" onPress={() => requireAuth(() => onClose())} />
        </View>
      ) : (
        <>
          {mockPlaylists.map((p) => {
            const on = selected === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.row, on && styles.rowOn]}
                onPress={() => setSelected(p.id)}
              >
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.meta}>{p.itemCount} items</Text>
              </Pressable>
            );
          })}
          <Button label="Create new playlist" variant="outline" style={{ marginTop: 8 }} />
          <Button label="Save" disabled={!selected} onPress={onClose} style={{ marginTop: 8 }} />
        </>
      )}
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12 },
    guestWrap: { alignItems: 'center', gap: 12, paddingVertical: 24 },
    guestText: { color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
    row: {
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    rowOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
    title: { color: colors.foreground, fontWeight: '600' },
    meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  });
}
