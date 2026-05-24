/** Бэйдж статуса (ТЗ §6.4). pulse — для URGENT. */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme';

import { Text } from './Text';

export interface BadgeProps {
  label: string;
  /** Базовый цвет — фон делается полупрозрачным, текст ярким. */
  color: string;
  pulse?: boolean;
}

function withAlpha(hex: string, alpha: number): string {
  // Поддержка только #RRGGBB; иные форматы возвращаются как есть.
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function Badge({ label, color, pulse = false }: BadgeProps) {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // ТЗ §17: пульсацию отключаем при «уменьшить движение».
    if (pulse && !reducedMotion) {
      opacity.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [pulse, reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: withAlpha(color, 0.18) },
        pulse && animatedStyle,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" weight="semibold" color={color}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
