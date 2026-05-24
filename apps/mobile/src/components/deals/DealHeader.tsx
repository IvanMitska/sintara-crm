/** Шапка карточки сделки: название, сумма, этап, приоритет, температура. */
import { Flame, Snowflake, ThermometerSun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { colors, dealPriorityColor, spacing } from '@/theme';
import type { Currency, Deal } from '@/types';

const TEMP = {
  HOT: { icon: Flame, color: colors.status.danger },
  WARM: { icon: ThermometerSun, color: colors.status.warning },
  COLD: { icon: Snowflake, color: colors.status.info },
} as const;

export function DealHeader({ deal }: { deal: Deal }) {
  const { t } = useTranslation();
  const temp = deal.temperature ? TEMP[deal.temperature] : null;
  const TempIcon = temp?.icon;

  return (
    <View style={styles.root}>
      <Text variant="title" weight="bold">
        {deal.title}
      </Text>
      <Text variant="display" weight="bold" color={colors.brand.accent500}>
        {formatCurrency(Number(deal.amount), deal.currency as Currency)}
      </Text>

      <View style={styles.badges}>
        {deal.stage ? (
          <Badge label={deal.stage.name} color={deal.stage.color} />
        ) : null}
        <Badge
          label={t(`status.priority${deal.priority}`)}
          color={dealPriorityColor[deal.priority] ?? colors.text.muted}
        />
        {temp && TempIcon ? (
          <View style={[styles.temp, { borderColor: temp.color }]}>
            <TempIcon size={13} color={temp.color} />
            <Text variant="caption" weight="semibold" color={temp.color}>
              {t(`status.temp${deal.temperature}`)}
            </Text>
          </View>
        ) : null}
      </View>

      {deal.owner ? (
        <View style={styles.owner}>
          <Avatar
            uri={deal.owner.avatar}
            firstName={deal.owner.firstName}
            lastName={deal.owner.lastName}
            size={28}
          />
          <Text variant="subhead" tone="secondary">
            {deal.owner.firstName} {deal.owner.lastName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2], paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  temp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  owner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
