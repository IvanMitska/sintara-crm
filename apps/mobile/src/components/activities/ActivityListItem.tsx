/** Строка активности на таймлайне (ТЗ §8.14). */
import {
  Activity as ActivityIcon,
  FileText,
  Mail,
  Phone,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { Activity } from '@/types';

/** type — строка; маппим известные значения на иконки. */
function iconFor(type: string): LucideIcon {
  const t = type.toUpperCase();
  if (t.includes('CALL')) return Phone;
  if (t.includes('MEET')) return Users;
  if (t.includes('MAIL') || t.includes('EMAIL')) return Mail;
  if (t.includes('NOTE')) return FileText;
  return ActivityIcon;
}

export function ActivityListItem({ activity }: { activity: Activity }) {
  const Icon = iconFor(activity.type);
  const author = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`
    : null;

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon size={16} color={colors.brand.primary500} />
      </View>
      <View style={styles.body}>
        <Text variant="callout" numberOfLines={3}>
          {activity.description}
        </Text>
        <Text variant="caption" tone="muted">
          {author ? `${author} · ` : ''}
          {formatRelative(activity.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[2] },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  body: { flex: 1, gap: 2 },
});
