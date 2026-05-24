/** Строка сделки: название, сумма, этап, приоритет/температура, ответственный. */
import { Flame, Snowflake, ThermometerSun, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Card, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { colors, dealStatusColor } from '@/theme';
import type { Currency, Deal } from '@/types';

const TEMP_ICON = {
  HOT: Flame,
  WARM: ThermometerSun,
  COLD: Snowflake,
} as const;

const TEMP_COLOR = {
  HOT: colors.status.danger,
  WARM: colors.status.warning,
  COLD: colors.status.info,
} as const;

export function DealListItem({ deal, onPress }: { deal: Deal; onPress?: () => void }) {
  const TempIcon = deal.temperature ? TEMP_ICON[deal.temperature] : null;
  const stageName = deal.stage?.name ?? deal.status;
  const stageColor = deal.stage?.color ?? dealStatusColor[deal.status] ?? '#888';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="callout" weight="semibold" numberOfLines={2} style={styles.title}>
          {deal.title}
        </Text>
        {deal.owner ? (
          <Avatar
            uri={deal.owner.avatar}
            firstName={deal.owner.firstName}
            lastName={deal.owner.lastName}
            size={28}
          />
        ) : null}
      </View>

      <Text variant="headline" weight="bold" color={colors.brand.accent500}>
        {formatCurrency(Number(deal.amount), deal.currency as Currency)}
      </Text>

      <View style={styles.metaRow}>
        <Badge label={stageName} color={stageColor} />
        {TempIcon ? (
          <TempIcon size={15} color={TEMP_COLOR[deal.temperature!]} />
        ) : null}
        {deal.hasOverdueTasks ? (
          <View style={styles.overdue}>
            <TriangleAlert size={13} color={colors.status.danger} />
            <Text variant="caption" color={colors.status.danger}>
              {deal.overdueTasksCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overdue: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
