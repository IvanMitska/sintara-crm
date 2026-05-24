/**
 * Дизайн-токены. Источник истины — apps/frontend/src/app/globals.css
 * и apps/frontend/tailwind.config.ts (ТЗ §6.2). Любое расхождение — баг.
 */

export const colors = {
  bg: {
    base: '#0a0a12',
    raised: '#0d0d18',
    card: 'rgba(18,18,28,0.7)',
    cardLight: 'rgba(22,22,42,0.6)',
    sidebar: 'rgba(12,12,20,0.85)',
    strong: 'rgba(15,15,25,0.9)',
    modalBackdrop: 'rgba(0,0,0,0.75)',
  },
  text: {
    primary: '#f5f5f7',
    secondary: 'rgba(245,245,247,0.72)',
    muted: 'rgba(245,245,247,0.55)',
    disabled: 'rgba(245,245,247,0.35)',
  },
  brand: {
    primary500: '#8B5CF6',
    primary600: '#6366F1',
    accent500: '#14B8A6',
    accent600: '#06B6D4',
    purple500: '#A855F7',
    pink: '#FF6B9D',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.12)',
  },
  // верхний highlight для glass-карточек
  glassHighlight: 'rgba(255,255,255,0.05)',
} as const;

export const gradients = {
  primary: ['#8B5CF6', '#6366F1'] as const,
  accent: ['#14B8A6', '#06B6D4'] as const,
  purple: ['#A855F7', '#8B5CF6'] as const,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 9999,
} as const;

/** Сетка: база 4px. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/** Типографика (ТЗ §6.5). line-height = size×1.4 кроме display. */
export const typography = {
  display: { fontSize: 32, lineHeight: 37 },
  title: { fontSize: 24, lineHeight: 30 },
  headline: { fontSize: 20, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 23 },
  callout: { fontSize: 15, lineHeight: 21 },
  subhead: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11, lineHeight: 15 },
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Motion (ТЗ §6.6). */
export const motion = {
  durationBase: 200,
  // Easing.bezier(0.16, 1, 0.3, 1)
  easing: [0.16, 1, 0.3, 1] as const,
  sheetSpring: { damping: 18, stiffness: 220 },
} as const;

export const blur = {
  card: 50,
  sheet: 80,
  tabBar: 70,
} as const;

export type ColorTokens = typeof colors;
export type RadiusToken = keyof typeof radius;
export type TypographyVariant = keyof typeof typography;
