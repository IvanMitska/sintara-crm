/** Строка раздела настроек: иконка + заголовок + значение/шеврон. */
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';

interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  /** Текущее значение справа (например язык). */
  value?: string;
  onPress?: () => void;
  /** Слот справа вместо шеврона (например Switch). */
  accessory?: React.ReactNode;
  danger?: boolean;
}

export function SettingsRow({
  icon: Icon,
  title,
  value,
  onPress,
  accessory,
  danger,
}: SettingsRowProps) {
  const tint = danger ? colors.status.danger : colors.brand.primary500;
  const content = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
        <Icon size={18} color={tint} />
      </View>
      <Text variant="body" weight="medium" color={danger ? colors.status.danger : undefined} style={styles.title}>
        {title}
      </Text>
      {value ? (
        <Text variant="subhead" tone="muted">
          {value}
        </Text>
      ) : null}
      {accessory ?? (onPress ? <ChevronRight size={18} color={colors.text.muted} /> : null)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  pressed: { opacity: 0.7 },
});
