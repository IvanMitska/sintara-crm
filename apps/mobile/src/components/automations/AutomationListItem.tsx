/** Строка автоматизации: название, описание, переключатель активности. */
import { Zap } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors } from '@/theme';
import type { Automation } from '@/types';

/** Извлекает человекочитаемый тип триггера из Json. */
export function triggerLabel(trigger: unknown): string {
  if (trigger && typeof trigger === 'object' && 'type' in trigger) {
    return String((trigger as { type: unknown }).type);
  }
  return 'Триггер';
}

export function AutomationListItem({
  automation,
  onPress,
  onToggle,
}: {
  automation: Automation;
  onPress?: () => void;
  onToggle?: (isActive: boolean) => void;
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: automation.isActive ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.05)' },
          ]}
        >
          <Zap
            size={18}
            color={automation.isActive ? colors.brand.primary500 : colors.text.muted}
          />
        </View>
        <View style={styles.body}>
          <Text variant="callout" weight="semibold" numberOfLines={1}>
            {automation.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {automation.description ?? triggerLabel(automation.trigger)}
          </Text>
        </View>
        <Switch
          value={automation.isActive}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary600 }}
          thumbColor="#fff"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
});
