/**
 * Glassmorphism-карточка (ТЗ §6.3). BlurView + полупрозрачная заливка +
 * бордер + верхний highlight. На Android API 26–30 blur может деградировать —
 * fallback на непрозрачную заливку.
 */
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { blur, colors, radius } from '@/theme';

type Variant = 'card' | 'strong';

export interface GlassCardProps extends ViewProps {
  variant?: Variant;
  /** Радиус скругления (по умолчанию lg для карточек, 2xl для strong). */
  rounded?: keyof typeof radius;
}

// Android < 31 рендерит blur нестабильно — отключаем (ТЗ §6.3).
const blurSupported = Platform.OS === 'ios' || (Platform.Version as number) >= 31;

export function GlassCard({
  variant = 'card',
  rounded,
  style,
  children,
  ...rest
}: GlassCardProps) {
  const r = radius[rounded ?? (variant === 'strong' ? '2xl' : 'lg')];
  const fill = variant === 'strong' ? colors.bg.strong : colors.bg.card;
  const intensity = variant === 'strong' ? blur.sheet : blur.card;

  const content = (
    <View
      style={[
        styles.inner,
        { borderRadius: r, backgroundColor: fill },
        !blurSupported && styles.fallback,
        style,
      ]}
      {...rest}
    >
      {/* Верхний световой highlight. */}
      <View style={[styles.highlight, { borderRadius: r }]} pointerEvents="none" />
      {children}
    </View>
  );

  if (!blurSupported) return content;

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, { borderRadius: r }]}>
      {content}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: { overflow: 'hidden' },
  inner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  fallback: {
    // непрозрачнее, раз blur недоступен
    backgroundColor: colors.bg.raised,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: colors.glassHighlight,
  },
});
