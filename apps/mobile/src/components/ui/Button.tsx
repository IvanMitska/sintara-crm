/** Кнопка с вариантами и состоянием загрузки (ТЗ §6, hit area ≥44pt §17). */
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, gradients, radius } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 56 };

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  icon,
  disabled,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress: PressableProps['onPress'] = (e) => {
    haptics.select();
    onPress?.(e);
  };

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={colors.text.primary} size="small" />
      ) : (
        <>
          {icon}
          <Text
            variant={size === 'sm' ? 'callout' : 'body'}
            weight="semibold"
            color={variant === 'secondary' || variant === 'ghost'
              ? colors.text.primary
              : '#fff'}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const base = [
    styles.base,
    { height: HEIGHT[size], borderRadius: radius.md },
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style as object,
  ];

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={handlePress}
        style={({ pressed }) => [base, pressed && styles.pressed]}
        {...rest}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
        />
        {inner}
      </Pressable>
    );
  }

  const variantStyle =
    variant === 'danger'
      ? styles.danger
      : variant === 'secondary'
        ? styles.secondary
        : styles.ghost;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [base, variantStyle, pressed && styles.pressed]}
      {...rest}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.status.danger },
});
