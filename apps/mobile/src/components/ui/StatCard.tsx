/** Карточка метрики (Quick Stats на «Сегодня», KPI в Аналитике). */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Акцентный цвет иконки. */
  accent?: string;
  /** Ширина (для горизонтального скролла). */
  width?: number;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  accent = colors.brand.primary500,
  width,
}: StatCardProps) {
  return (
    <GlassCard style={[styles.card, width ? { width } : undefined]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
        <Icon size={18} color={accent} />
      </View>
      <Text variant="title" weight="bold">
        {value}
      </Text>
      <Text variant="subhead" tone="muted" numberOfLines={2}>
        {label}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing[4], gap: spacing[2] },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
