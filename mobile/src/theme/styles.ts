import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './tokens';

/** Shared layout patterns mirroring the web Tailwind utilities. */
export const commonStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pagePad: {
    paddingHorizontal: spacing.page,
  },
  stickyHeader: {
    backgroundColor: withAlphaBg(colors.background, 0.95),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  glassBar: {
    backgroundColor: withAlphaBg(colors.background, 0.95),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlphaBg(colors.border, 1),
  },
  cardSoft: {
    backgroundColor: withAlphaBg(colors.card, 0.4),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: withAlphaBg(colors.border, 0.8),
  },
  cardGradient: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlphaBg(colors.border, 0.8),
    overflow: 'hidden',
  },
  heroBrand: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlphaBg(colors.border, 0.6),
    backgroundColor: colors.card,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: withAlphaHex(colors.primary, 0.1),
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    color: colors.foreground,
    fontSize: 14,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: withAlphaHex(colors.border, 0.4),
    paddingTop: spacing.xl,
    marginTop: spacing.sm,
  },
  accentBar: {
    width: 4,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: withAlphaHex(colors.primary, 0.1),
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
});

function withAlphaHex(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function withAlphaBg(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export { typography };
