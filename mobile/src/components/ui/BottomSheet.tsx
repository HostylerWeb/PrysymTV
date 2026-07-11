import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, typography } from '@/theme/tokens';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  height?: ViewStyle['height'];
};

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  scroll = true,
  height = '88%',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginTop: 10,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          ...typography.h2,
          color: colors.foreground,
          flex: 1,
          textAlign: 'center',
          fontSize: 16,
        },
        close: { width: 36, alignItems: 'flex-start' },
        closePlaceholder: { width: 36 },
        scroll: { flex: 1 },
        scrollContent: { padding: 16, paddingBottom: 24 },
        body: { flex: 1, padding: 16 },
      }),
    [colors],
  );
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { height, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <View style={styles.closePlaceholder} />
          </View>
          <Body
            style={scroll ? styles.scroll : styles.body}
            contentContainerStyle={scroll ? styles.scrollContent : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </Body>
        </View>
      </View>
    </Modal>
  );
}
