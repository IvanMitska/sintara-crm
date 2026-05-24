/** Поле ввода с лейблом, ошибкой и слотами иконок (ТЗ §6). */
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, typography } from '@/theme';

import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, onRightIconPress, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="subhead" weight="medium" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.text.disabled}
          selectionColor={colors.brand.primary500}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onRightIconPress}
            style={styles.icon}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={colors.status.danger} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  focused: {
    borderColor: 'rgba(139,92,246,0.5)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  errored: { borderColor: colors.status.danger },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.body.fontSize,
    paddingVertical: 12,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  error: { marginLeft: 2 },
});
