/** Сегментированный переключатель (ТЗ §8.3 «Сделки · Лиды · Воронка»). */
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

import { Text } from './Text';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const count = options.length;
  const segWidth = count > 0 ? width / count : 0;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <View
          style={[
            styles.thumb,
            { width: segWidth - 4, left: activeIndex * segWidth + 2 },
          ]}
        />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}
            onPress={() => {
              if (active) return;
              haptics.select();
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onChange(opt.value);
            }}
          >
            <Text
              variant="callout"
              weight={active ? 'semibold' : 'medium'}
              tone={active ? 'primary' : 'muted'}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: 2,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
