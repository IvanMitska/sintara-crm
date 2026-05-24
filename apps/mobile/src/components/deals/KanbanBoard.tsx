/**
 * Kanban-воронка (ТЗ §8.3). Фаза 2 — просмотр: горизонтальный скролл этапов,
 * внутри — вертикальный список сделок. Drag&drop — Фаза 3.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass';
import { TAB_BAR_HEIGHT } from '@/components/layout/Screen';
import { Card, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { useDealBoard, usePipelines } from '@/hooks/queries';
import { formatCurrency } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme';
import type { Currency, Deal } from '@/types';

const COLUMN_WIDTH = 270;

export function KanbanBoard() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pipelines = usePipelines();
  const [pipelineId, setPipelineId] = useState<string>();

  // Выбор воронки по умолчанию (isDefault → первая).
  useEffect(() => {
    if (!pipelineId && pipelines.data?.length) {
      const def = pipelines.data.find((p) => p.isDefault) ?? pipelines.data[0];
      setPipelineId(def?.id);
    }
  }, [pipelines.data, pipelineId]);

  const board = useDealBoard(pipelineId);

  if (pipelines.isLoading || board.isLoading) return <ScreenSkeleton kind="list" />;
  if (pipelines.error) {
    return <ScreenError error={pipelines.error} onRetry={() => pipelines.refetch()} />;
  }
  if (!pipelines.data?.length) {
    return <ScreenError kind="empty" message={t('deals.pipelinesEmpty')} />;
  }

  return (
    <View style={styles.flex}>
      {/* Селектор воронки */}
      {pipelines.data.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineRow}
        >
          {pipelines.data.map((p) => {
            const active = p.id === pipelineId;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => {
                  haptics.select();
                  setPipelineId(p.id);
                }}
                style={[styles.pipelinePill, active && styles.pipelinePillActive]}
              >
                <Text
                  variant="subhead"
                  weight={active ? 'semibold' : 'medium'}
                  tone={active ? 'primary' : 'muted'}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardRow}
      >
        {(board.data?.stages ?? []).map((stage) => (
          <View key={stage.id} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={styles.columnTitle}>
                <View style={[styles.dot, { backgroundColor: stage.color }]} />
                <Text variant="callout" weight="semibold" numberOfLines={1}>
                  {stage.name}
                </Text>
                <Text variant="subhead" tone="muted">
                  {stage.dealsCount}
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {formatCurrency(stage.totalAmount, 'THB')}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: spacing[2],
                paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4],
              }}
            >
              {stage.deals.map((deal: Deal) => (
                <Card
                  key={deal.id}
                  onPress={() => router.push(`/(tabs)/deals/${deal.id}`)}
                  style={styles.miniCard}
                >
                  <Text variant="subhead" weight="semibold" numberOfLines={2}>
                    {deal.title}
                  </Text>
                  <Text variant="caption" weight="bold" color={colors.brand.accent500}>
                    {formatCurrency(Number(deal.amount), deal.currency as Currency)}
                  </Text>
                </Card>
              ))}
              {stage.deals.length === 0 ? (
                <GlassCard style={styles.emptyCol}>
                  <Text variant="caption" tone="muted" center>
                    {t('deals.stageEmpty')}
                  </Text>
                </GlassCard>
              ) : null}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pipelineRow: { gap: spacing[2], paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  pipelinePill: {
    paddingHorizontal: spacing[3],
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  pipelinePillActive: {
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderColor: colors.border.strong,
  },
  boardRow: { paddingHorizontal: spacing[4], gap: spacing[3] },
  column: { width: COLUMN_WIDTH, gap: spacing[2] },
  columnHeader: { gap: 2, paddingBottom: spacing[1] },
  columnTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  miniCard: { padding: 12, gap: 6 },
  emptyCol: { padding: spacing[4] },
});
