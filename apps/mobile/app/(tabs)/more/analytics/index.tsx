import { BarChart3, Briefcase, Coins, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FunnelBars } from '@/components/analytics/FunnelBars';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { ScreenError, SectionHeader, Segmented, StatCard, Text } from '@/components/ui';
import { useDashboard, useFunnel, useSalesAnalytics } from '@/hooks/queries';
import { useCan } from '@/hooks/useCan';
import { formatCurrency } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Period = 'today' | 'week' | 'month' | 'quarter';

function rangeFor(period: Period): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(start.getDate() - 7);
  else if (period === 'month') start.setMonth(start.getMonth() - 1);
  else start.setMonth(start.getMonth() - 3);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const canView = useCan('analytics.view');
  const [period, setPeriod] = useState<Period>('month');

  const range = useMemo(() => rangeFor(period), [period]);
  const dashboard = useDashboard();
  const funnel = useFunnel();
  const sales = useSalesAnalytics(range.start, range.end);

  if (!canView) {
    return (
      <CosmicBg>
        <StackHeader title={t('more.analytics')} />
        <ScreenError message="Раздел доступен менеджерам и администраторам" />
      </CosmicBg>
    );
  }

  const d = dashboard.data;
  const s = sales.data;

  return (
    <CosmicBg>
      <StackHeader title={t('more.analytics')} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'День' },
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
            { value: 'quarter', label: 'Квартал' },
          ]}
        />

        {/* KPI */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <StatCard
              icon={Coins}
              value={formatCurrency(s?.totalAmount ?? 0, 'THB')}
              label="Выручка за период"
              accent={colors.brand.accent500}
            />
          </View>
          <View style={styles.kpiCell}>
            <StatCard
              icon={Briefcase}
              value={s?.totalDeals ?? 0}
              label="Сделок за период"
            />
          </View>
          <View style={styles.kpiCell}>
            <StatCard
              icon={TrendingUp}
              value={formatCurrency(Math.round(s?.averageAmount ?? 0), 'THB')}
              label="Средний чек"
              accent={colors.status.success}
            />
          </View>
          <View style={styles.kpiCell}>
            <StatCard
              icon={BarChart3}
              value={d?.activeDeals ?? 0}
              label="Активных сделок"
              accent={colors.status.info}
            />
          </View>
        </View>

        {/* Воронка конверсии */}
        <View style={styles.section}>
          <SectionHeader title="Воронка конверсии" />
          <FunnelBars stages={funnel.data ?? []} loading={funnel.isLoading} />
        </View>

        {/* Продажи по этапам */}
        <View style={styles.section}>
          <SectionHeader title="Сделки по этапам" />
          <GlassCard style={styles.card}>
            {s && Object.keys(s.dealsByStage).length > 0 ? (
              Object.entries(s.dealsByStage).map(([stage, count]) => (
                <View key={stage} style={styles.stageRow}>
                  <Text variant="callout" tone="secondary">
                    {stage}
                  </Text>
                  <Text variant="callout" weight="bold">
                    {count}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="callout" tone="muted" center>
                Нет данных за период
              </Text>
            )}
          </GlassCard>
        </View>
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  kpiCell: { width: '47%', flexGrow: 1 },
  section: { gap: spacing[2] },
  card: { padding: spacing[4], gap: spacing[2] },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
