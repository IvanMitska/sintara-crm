/** Заголовок секции списка с опциональным действием справа. */
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  /** Подпись действия справа (например «Все»). */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Счётчик рядом с заголовком. */
  count?: number;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  count,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <Text variant="headline" weight="semibold">
          {title}
        </Text>
        {count !== undefined ? (
          <View style={styles.badge}>
            <Text variant="caption" weight="bold" tone="secondary">
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onActionPress}>
          <Text variant="subhead" weight="semibold" color={colors.brand.primary500}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
