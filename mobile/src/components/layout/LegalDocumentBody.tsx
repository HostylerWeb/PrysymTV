import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { LegalBlock, LegalDocument } from '@legal/types';
import { renderInlineNative } from '@legal/parse-inline';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

function useLegalStyles() {
  const { colors } = useTheme();
  return StyleSheet.create({
    section: { gap: spacing.sm, marginBottom: spacing.lg },
    h2: { ...typography.h3, color: colors.foreground, marginTop: spacing.md },
    h3: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: spacing.sm },
    p: { fontSize: 14, lineHeight: 22, color: colors.mutedForeground },
    list: { gap: spacing.sm, paddingLeft: spacing.md },
    listItem: { fontSize: 14, lineHeight: 22, color: colors.mutedForeground },
    link: { color: colors.primary, textDecorationLine: 'underline' },
    bold: { fontWeight: '700', color: colors.mutedForeground },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
      marginVertical: spacing.sm,
    },
    tableRow: { flexDirection: 'row' },
    tableHeader: {
      flex: 1,
      padding: spacing.sm,
      backgroundColor: colors.secondary,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tableHeaderText: { fontSize: 12, fontWeight: '700', color: colors.foreground },
    tableCell: {
      flex: 1,
      padding: spacing.sm,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tableCellText: { fontSize: 12, lineHeight: 18, color: colors.mutedForeground },
  });
}

function InlineText({
  text,
  styles,
  onLinkPress,
}: {
  text: string;
  styles: ReturnType<typeof useLegalStyles>;
  onLinkPress: (href: string) => void;
}) {
  const nodes = renderInlineNative(text, {
    onLinkPress,
    Text: ({ children }) => <Text style={styles.p}>{children}</Text>,
    Bold: ({ children }) => <Text style={styles.bold}>{children}</Text>,
    LinkText: ({ children, onPress }) => (
      <Text style={styles.link} onPress={onPress}>
        {children}
      </Text>
    ),
  });

  return <Text style={styles.p}>{nodes}</Text>;
}

function LegalBlockView({
  block,
  styles,
  onLinkPress,
}: {
  block: LegalBlock;
  styles: ReturnType<typeof useLegalStyles>;
  onLinkPress: (href: string) => void;
}) {
  switch (block.type) {
    case 'h2':
      return <Text style={styles.h2}>{block.text}</Text>;
    case 'h3':
      return <Text style={styles.h3}>{block.text}</Text>;
    case 'p':
      return <InlineText text={block.text} styles={styles} onLinkPress={onLinkPress} />;
    case 'ul':
      return (
        <View style={styles.list}>
          {block.items.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Text style={styles.listItem}>•</Text>
              <View style={{ flex: 1 }}>
                <InlineText text={item} styles={styles} onLinkPress={onLinkPress} />
              </View>
            </View>
          ))}
        </View>
      );
    case 'ol':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={item} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Text style={styles.listItem}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <InlineText text={item} styles={styles} onLinkPress={onLinkPress} />
              </View>
            </View>
          ))}
        </View>
      );
    case 'table':
      return (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {block.headers.map((header) => (
              <View key={header} style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>{header}</Text>
              </View>
            ))}
          </View>
          {block.rows.map((row) => (
            <View key={row.join('|')} style={styles.tableRow}>
              {row.map((cell) => (
                <View key={cell} style={styles.tableCell}>
                  <InlineText text={cell} styles={styles} onLinkPress={onLinkPress} />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function LegalDocumentBody({ document }: { document: LegalDocument }) {
  const router = useRouter();
  const styles = useLegalStyles();

  const onLinkPress = (href: string) => {
    if (href.startsWith('mailto:')) {
      void Linking.openURL(href);
      return;
    }
    router.push(href as never);
  };

  let sectionBlocks: LegalBlock[] = [];
  const sections: LegalBlock[][] = [];

  document.blocks.forEach((block) => {
    if (block.type === 'h2' && sectionBlocks.length > 0) {
      sections.push(sectionBlocks);
      sectionBlocks = [];
    }
    sectionBlocks.push(block);
  });
  if (sectionBlocks.length > 0) sections.push(sectionBlocks);

  return (
    <>
      {sections.map((blocks, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.section}>
          {blocks.map((block, blockIndex) => (
            <LegalBlockView
              key={`${sectionIndex}-${blockIndex}`}
              block={block}
              styles={styles}
              onLinkPress={onLinkPress}
            />
          ))}
        </View>
      ))}
    </>
  );
}
