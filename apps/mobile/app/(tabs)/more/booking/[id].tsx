import { useLocalSearchParams } from 'expo-router';
import { CalendarCheck, CircleCheck, CircleX, UserX } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Badge, Button, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useBookingStatusAction } from '@/hooks/mutations';
import { useBooking } from '@/hooks/queries';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { bookingStatusColor, colors, spacing } from '@/theme';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Не пришёл',
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: booking, isLoading, error, refetch } = useBooking(id);
  const actions = useBookingStatusAction();

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Бронь" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !booking) {
    return (
      <CosmicBg>
        <StackHeader title="Бронь" />
        <ScreenError
          error={error}
          kind={booking ? 'error' : 'not-found'}
          onRetry={refetch}
        />
      </CosmicBg>
    );
  }

  const open = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const run = (
    fn: { mutate: (id: string, opts?: object) => void; isPending: boolean },
    msg: string,
  ) =>
    fn.mutate(id, {
      onSuccess: () => toast.success(msg),
      onError: () => toast.error('Ошибка'),
    });

  return (
    <CosmicBg>
      <StackHeader title="Бронь" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text variant="title" weight="bold" style={styles.flex}>
            {booking.contact
              ? `${booking.contact.firstName} ${booking.contact.lastName}`
              : (booking.title ?? 'Бронь')}
          </Text>
          <Badge
            label={STATUS_LABEL[booking.status] ?? booking.status}
            color={bookingStatusColor[booking.status] ?? '#888'}
          />
        </View>

        <GlassCard style={styles.card}>
          <InfoRow label="Начало" value={formatDateTime(booking.startTime)} />
          <InfoRow label="Окончание" value={formatDateTime(booking.endTime)} />
          <InfoRow label="Ресурс" value={booking.resource?.name} />
          <InfoRow label="Услуга" value={booking.service?.name} />
          <InfoRow label="Заметки" value={booking.notes} />
        </GlassCard>

        {open ? (
          <View style={styles.actions}>
            {booking.status === 'PENDING' ? (
              <Button
                title="Подтвердить"
                icon={<CalendarCheck size={16} color="#fff" />}
                loading={actions.confirm.isPending}
                onPress={() => run(actions.confirm, 'Бронь подтверждена')}
              />
            ) : null}
            <Button
              title="Завершить"
              variant="secondary"
              icon={<CircleCheck size={16} color={colors.text.primary} />}
              loading={actions.complete.isPending}
              onPress={() => run(actions.complete, 'Бронь завершена')}
            />
            <View style={styles.row}>
              <Button
                title="Отменить"
                variant="danger"
                style={styles.flex}
                icon={<CircleX size={16} color="#fff" />}
                onPress={() =>
                  actions.cancel.mutate(
                    { id },
                    {
                      onSuccess: () => toast.info('Бронь отменена'),
                      onError: () => toast.error('Ошибка'),
                    },
                  )
                }
              />
              <Button
                title="Не пришёл"
                variant="secondary"
                style={styles.flex}
                icon={<UserX size={16} color={colors.text.primary} />}
                onPress={() => run(actions.noShow, 'Отмечено: не пришёл')}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1 },
  card: { padding: spacing[4] },
  actions: { gap: spacing[2] },
  row: { flexDirection: 'row', gap: spacing[2] },
});
