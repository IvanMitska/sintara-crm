/** Shimmer-скелет (ТЗ §6.6): 1.2s, opacity 0.3→0.7. Поверх Reanimated. */
import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: keyof typeof radius;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = 'sm',
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // ТЗ §17: при «уменьшить движение» — статичная непрозрачность.
    if (reducedMotion) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(withTiming(0.7, { duration: 1200 }), -1, true);
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius[rounded] },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: 'rgba(255,255,255,0.08)' },
});
