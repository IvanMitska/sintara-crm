/** Строка лида: имя, источник, телефон, статус, время. */
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Card, Text } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { leadStatusColor } from '@/theme';
import type { Lead } from '@/types';

export function LeadListItem({ lead, onPress }: { lead: Lead; onPress?: () => void }) {
  const { t } = useTranslation();
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar firstName={lead.name} size={40} />
        <View style={styles.body}>
          <Text variant="callout" weight="semibold" numberOfLines={1}>
            {lead.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {t(`status.source${lead.source}`)}
            {lead.phone ? ` · ${lead.phone}` : ''}
          </Text>
        </View>
        <View style={styles.right}>
          <Badge
            label={t(`status.lead${lead.status}`)}
            color={leadStatusColor[lead.status] ?? '#888'}
          />
          <Text variant="caption" tone="muted">
            {formatRelative(lead.createdAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
});
