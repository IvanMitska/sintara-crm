/** Строка компании: иконка, название, отрасль/город. */
import { Building2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors } from '@/theme';
import type { Company } from '@/types';

export function CompanyListItem({
  company,
  onPress,
}: {
  company: Company;
  onPress?: () => void;
}) {
  const subtitle = company.industry ?? company.address ?? company.phone ?? '';
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Building2 size={20} color={colors.brand.primary500} />
        </View>
        <View style={styles.body}>
          <Text variant="callout" weight="semibold" numberOfLines={1}>
            {company.name}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
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
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  body: { flex: 1, gap: 2 },
});
