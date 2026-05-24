/** Строка уведомления (ТЗ §8.15). */
import { Bell, Briefcase, CircleCheck, MessageCircle, UserPlus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { colors } from '@/theme';
import type { AppNotification } from '@/types';

function iconFor(type: string) {
  const t = type.toLowerCase();
  if (t.includes('deal')) return Briefcase;
  if (t.includes('lead')) return UserPlus;
  if (t.includes('message')) return MessageCircle;
  if (t.includes('task')) return CircleCheck;
  return Bell;
}

export function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress?: () => void;
}) {
  const Icon = iconFor(notification.type);
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            !notification.isRead && styles.iconWrapUnread,
          ]}
        >
          <Icon
            size={18}
            color={notification.isRead ? colors.text.muted : colors.brand.primary500}
          />
        </View>
        <View style={styles.body}>
          <Text variant="callout" weight={notification.isRead ? 'medium' : 'semibold'}>
            {notification.title}
          </Text>
          <Text variant="subhead" tone="muted" numberOfLines={2}>
            {notification.content}
          </Text>
          <Text variant="caption" tone="disabled">
            {formatRelative(notification.createdAt)}
          </Text>
        </View>
        {!notification.isRead ? <View style={styles.dot} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconWrapUnread: { backgroundColor: 'rgba(139,92,246,0.14)' },
  body: { flex: 1, gap: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary500,
    marginTop: 4,
  },
});
