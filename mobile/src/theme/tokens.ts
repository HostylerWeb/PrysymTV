/**
 * Design tokens aligned with web `app/globals.css` (Prysym TV).
 */
export const darkColors = {
  background: '#030303',
  foreground: '#F8F8F8',
  card: '#0B0B0B',
  cardForeground: '#F8F8F8',
  popover: '#060606',
  primary: '#EF511D',
  primaryForeground: '#F8F8F8',
  secondary: '#161616',
  secondaryForeground: '#E5E5E5',
  muted: '#1B1B1B',
  mutedForeground: '#8F8F8F',
  accent: '#EF511D',
  destructive: '#C80035',
  border: '#222222',
  input: '#161616',
  ring: '#EF511D',
  live: '#EF511D',
  sidebar: '#060606',
  success: '#22C55E',
  warning: '#F59E0B',
  yellow: '#EAB308',
  /** Immersive video surfaces (shorts, players) */
  videoBackground: '#000000',
  /** Text/icons on top of video */
  onVideo: '#F8F8F8',
  /** Modal/sheet scrim */
  scrim: 'rgba(0,0,0,0.65)',
  scrimLight: 'rgba(0,0,0,0.45)',
  /** Hero gradient overlays */
  heroScrim: 'rgba(3,3,3,0.55)',
  heroScrimLight: 'rgba(3,3,3,0.35)',
  /** Shorts action button fill */
  onVideoMuted: 'rgba(255,255,255,0.12)',
  onVideoSoft: 'rgba(255,255,255,0.9)',
  onVideoCaption: 'rgba(255,255,255,0.75)',
} as const;

export const lightColors = {
  background: '#FAFAFA',
  foreground: '#171717',
  card: '#FFFFFF',
  cardForeground: '#171717',
  popover: '#FFFFFF',
  primary: '#EF511D',
  primaryForeground: '#FAFAFA',
  secondary: '#F4F4F5',
  secondaryForeground: '#27272A',
  muted: '#F4F4F5',
  mutedForeground: '#71717A',
  accent: '#EF511D',
  destructive: '#DC2626',
  border: '#E4E4E7',
  input: '#E4E4E7',
  ring: '#EF511D',
  live: '#EF511D',
  sidebar: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  yellow: '#CA8A04',
  videoBackground: '#000000',
  onVideo: '#F8F8F8',
  scrim: 'rgba(0,0,0,0.55)',
  scrimLight: 'rgba(0,0,0,0.35)',
  heroScrim: 'rgba(250,250,250,0.75)',
  heroScrimLight: 'rgba(250,250,250,0.55)',
  onVideoMuted: 'rgba(255,255,255,0.12)',
  onVideoSoft: 'rgba(255,255,255,0.9)',
  onVideoCaption: 'rgba(255,255,255,0.75)',
} as const;

export type ThemeColors = { [K in keyof typeof darkColors]: string };

/** Default static palette (dark). Prefer `useTheme().colors` in new screens. */
export const colors = darkColors;

/** Append 2-digit hex alpha to a 6-char hex color. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  page: 16,
  tabBar: 56,
  tabBarPadding: 96,
  header: 72,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

export const typography = {
  hero: { fontSize: 30, fontFamily: fonts.bold, fontWeight: '700' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontFamily: fonts.bold, fontWeight: '700' as const },
  h2: { fontSize: 20, fontFamily: fonts.semibold, fontWeight: '600' as const },
  h3: { fontSize: 18, fontFamily: fonts.bold, fontWeight: '700' as const },
  section: { fontSize: 18, fontFamily: fonts.bold, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontFamily: fonts.regular, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontFamily: fonts.medium, fontWeight: '500' as const },
  caption: { fontSize: 12, fontFamily: fonts.medium, fontWeight: '500' as const },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  micro: { fontSize: 10, fontFamily: fonts.medium, fontWeight: '500' as const },
  button: { fontSize: 14, fontFamily: fonts.semibold, fontWeight: '600' as const },
} as const;

export const shadows = {
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  primaryButton: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;
