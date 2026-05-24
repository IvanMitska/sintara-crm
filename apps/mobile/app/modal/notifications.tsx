import { router } from 'expo-router';
import { CheckCheck, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EntityList, Text } from '@/components/ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/queries';
import { colors, spacing } from '@/theme';
import type { AppNotification } from '@/types';

/** Уведомления (ТЗ §8.15): список, прочтение, deep links. */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isRefetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const hasUnread = (data ?? []).some((n) => !n.isRead);

  const onItemPress = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id);
    // Deep link из metadata.url (ТЗ §10.2).
    const url = (n.metadata as { url?: string } | null)?.url;
    if (url) {
      router.back();
      router.push(url as never);
    }
  };

  return (
    <CosmicBg>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text variant="headline" weight="semibold" style={styles.title}>
          {t('notifications.title')}
        </Text>
        {hasUnread ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Прочитать все"
            hitSlop={8}
            onPress={() => markAll.mutate()}
            style={styles.action}
          >
            <CheckCheck size={20} color={colors.brand.primary500} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          hitSlop={10}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <EntityList<AppNotification>
        data={data ?? []}
        keyExtractor={(n) => n.id}
        estimatedItemSize={84}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('notifications.empty')}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={() => onItemPress(item)} />
        )}
      />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[4],
  },
  title: { flex: 1 },
  action: {},
});
