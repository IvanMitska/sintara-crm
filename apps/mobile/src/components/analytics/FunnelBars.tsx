/** Горизонтальные бары воронки конверсии (ТЗ §8.13). */
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Skeleton, Text } from '@/components/ui';
import { radius, spacing } from '@/theme';
import type { FunnelStage } from '@/types';

export function FunnelBars({
  stages,
  loading,
}: {
  stages: FunnelStage[];
  loading?: boolean;
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <GlassCard style={styles.card}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={28} rounded="sm" />
        ))}
      </GlassCard>
    );
  }

  if (stages.length === 0) {
    return (
      <GlassCard style={styles.card}>
        <Text variant="callout" tone="muted" center>
          {t('today.funnelEmpty')}
        </Text>
      </GlassCard>
    );
  }

  const max = Math.max(1, ...stages.map((s) => s.dealsCount));

  return (
    <GlassCard style={styles.card}>
      {stages.map((stage) => (
        <View key={stage.id} style={styles.row}>
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: stage.color }]} />
            <Text variant="subhead" weight="medium" numberOfLines={1} style={styles.name}>
              {stage.name}
            </Text>
            <Text variant="subhead" weight="bold">
              {stage.dealsCount}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(stage.dealsCount / max) * 100}%`,
                  backgroundColor: stage.color,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing[4], gap: spacing[3] },
  row: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.pill, minWidth: 4 },
});
