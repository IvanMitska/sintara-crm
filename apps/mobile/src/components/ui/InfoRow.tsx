/** Строка «лейбл — значение» для карточек обзора. */
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface InfoRowProps {
  label: string;
  value?: string | null;
  /** Сделать значение тапабельным (телефон/email). */
  onPress?: () => void;
}

export function InfoRow({ label, value, onPress }: InfoRowProps) {
  if (!value) return null;
  const valueNode = (
    <Text
      variant="callout"
      weight="medium"
      color={onPress ? colors.brand.primary500 : undefined}
      style={styles.value}
    >
      {value}
    </Text>
  );

  return (
    <View style={styles.row}>
      <Text variant="callout" tone="muted">
        {label}
      </Text>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.valueWrap}>
          {valueNode}
        </Pressable>
      ) : (
        <View style={styles.valueWrap}>{valueNode}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  valueWrap: { flex: 1 },
  value: { textAlign: 'right' },
});
