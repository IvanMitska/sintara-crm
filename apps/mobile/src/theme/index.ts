import {
  blur,
  colors,
  fontFamily,
  gradients,
  motion,
  radius,
  spacing,
  typography,
} from './tokens';

export * from './tokens';
export * from './status';

/** Единый объект темы для не-NativeWind мест (анимации, Skia, нативные опции). */
export const theme = {
  colors,
  radius,
  spacing,
  typography,
  fontFamily,
  motion,
  blur,
  gradients,
} as const;

export type Theme = typeof theme;
