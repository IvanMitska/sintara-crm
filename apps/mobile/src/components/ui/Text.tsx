/** Типизированный текст по шкале ТЗ §6.5. Шрифт Inter. */
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, fontFamily, typography, type TypographyVariant } from '@/theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Tone = 'primary' | 'secondary' | 'muted' | 'disabled';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  weight?: Weight;
  tone?: Tone;
  color?: string;
  center?: boolean;
}

const toneColor: Record<Tone, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  disabled: colors.text.disabled,
};

export function Text({
  variant = 'body',
  weight = 'regular',
  tone = 'primary',
  color,
  center,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        {
          fontFamily: fontFamily[weight],
          color: color ?? toneColor[tone],
        },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
