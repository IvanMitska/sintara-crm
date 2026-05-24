/** Простая непрозрачная карточка списка (без blur — для производительности списков). */
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ onPress, padded = true, style, children, ...rest }: CardProps) {
  const content = (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.bg.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  padded: { padding: 16 },
  pressed: { opacity: 0.85 },
});
