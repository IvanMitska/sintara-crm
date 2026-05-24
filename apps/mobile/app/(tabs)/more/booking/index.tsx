import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Badge, Card, ScreenError, ScreenSkeleton, Segmented, Text } from '@/components/ui';
import {
  useBookingStats,
  useResources,
  useSchedule,
  useServices,
} from '@/hooks/queries';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { bookingStatusColor, colors, spacing } from '@/theme';
import type { Currency } from '@/types';

type Segment = 'schedule' | 'resources' | 'services';

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Не пришёл',
};

/** Онлайн-запись (ТЗ §8.12). Фаза 2 — просмотр. Создание брони — Фаза 3. */
export default function BookingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('schedule');

  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const schedule = useSchedule(range.from, range.to);
  const resources = useResources();
  const services = useServices();
  const stats = useBookingStats();

  return (
    <CosmicBg>
      <StackHeader title={t('more.booking')} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {stats.data ? (
          <View style={styles.statsRow}>
            <Stat value={stats.data.byStatus.pending} label="Ожидают" />
            <Stat value={stats.data.byStatus.confirmed} label="Подтв." />
            <Stat value={stats.data.byStatus.completed} label="Завершено" />
          </View>
        ) : null}

        <Segmented<Segment>
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'schedule', label: 'Расписание' },
            { value: 'resources', label: 'Ресурсы' },
            { value: 'services', label: 'Услуги' },
          ]}
        />

        {segment === 'schedule' ? (
          <Section query={schedule} empty="Записей на неделю нет">
            {(schedule.data?.bookings ?? []).map((b) => (
              <Card
                key={b.id}
                style={styles.row}
                onPress={() => router.push(`/(tabs)/more/booking/${b.id}`)}
              >
                <View style={styles.rowBody}>
                  <Text variant="callout" weight="semibold" numberOfLines={1}>
                    {b.contact
                      ? `${b.contact.firstName} ${b.contact.lastName}`
                      : (b.title ?? 'Бронь')}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {formatDateTime(b.startTime)}
                    {b.service ? ` · ${b.service.name}` : ''}
                  </Text>
                </View>
                <Badge
                  label={BOOKING_STATUS_LABEL[b.status] ?? b.status}
                  color={bookingStatusColor[b.status] ?? '#888'}
                />
              </Card>
            ))}
          </Section>
        ) : segment === 'resources' ? (
          <Section query={resources} empty="Ресурсов нет">
            {(resources.data ?? []).map((r) => (
              <Card key={r.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <View style={styles.rowBody}>
                  <Text variant="callout" weight="semibold">
                    {r.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {r.type} · слот {r.slotDuration} мин
                  </Text>
                </View>
              </Card>
            ))}
          </Section>
        ) : (
          <Section query={services} empty="Услуг нет">
            {(services.data ?? []).map((s) => (
              <Card key={s.id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text variant="callout" weight="semibold">
                    {s.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {s.duration} мин
                  </Text>
                </View>
                <Text variant="callout" weight="bold" color={colors.brand.accent500}>
                  {formatCurrency(Number(s.price), s.currency as Currency)}
                </Text>
              </Card>
            ))}
          </Section>
        )}
      </ScrollView>
    </CosmicBg>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard style={styles.stat}>
      <Text variant="headline" weight="bold" color={colors.brand.primary500}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </GlassCard>
  );
}

/** Обёртка с состояниями loading/error/empty для секции. */
function Section({
  query,
  empty,
  children,
}: {
  query: { isLoading: boolean; error: unknown; refetch: () => void };
  empty: string;
  children: React.ReactNode;
}) {
  if (query.isLoading) return <ScreenSkeleton kind="list" />;
  if (query.error) return <ScreenError error={query.error} onRetry={query.refetch} />;
  const arr = Array.isArray(children) ? children : [children];
  if (arr.flat().filter(Boolean).length === 0) {
    return <ScreenError kind="empty" message={empty} />;
  }
  return <View style={styles.list}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  statsRow: { flexDirection: 'row', gap: spacing[2] },
  stat: { flex: 1, alignItems: 'center', padding: spacing[3], gap: 2 },
  list: { gap: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: 12 },
  rowBody: { flex: 1, gap: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
