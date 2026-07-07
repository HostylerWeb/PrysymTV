import React from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type Props = ScrollViewProps & {
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
};

export function Screen({ children, padded = true, edges = ['top'], style, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        padded && styles.padded,
        edges.includes('top') && { paddingTop: insets.top + spacing.sm },
        edges.includes('bottom') && { paddingBottom: insets.bottom + spacing.tabBarPadding },
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenBody({ children }: { children: React.ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padded: { paddingHorizontal: spacing.page },
  body: { gap: spacing.lg },
});
