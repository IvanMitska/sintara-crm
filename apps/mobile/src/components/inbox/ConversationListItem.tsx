/** Строка диалога в инбоксе (ТЗ §8.5). */
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Text } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { colors } from '@/theme';
import type { Conversation } from '@/types';

const CHANNEL_COLOR: Record<string, string> = {
  telegram: '#2AABEE',
  whatsapp: '#25D366',
  email: '#F59E0B',
  internal: '#8B5CF6',
};

/** Бренд-каналы оставляем как есть; internal — переводим. */
const CHANNEL_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export function ConversationListItem({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { contact, lastMessage, unreadCount, lastChannel } = conversation;
  const channelColor = CHANNEL_COLOR[lastChannel] ?? colors.text.muted;
  const channelLabel =
    CHANNEL_LABEL[lastChannel] ??
    (lastChannel === 'internal' ? t('inbox.channelInternal') : lastChannel);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar
          uri={contact.avatar}
          firstName={contact.firstName}
          lastName={contact.lastName}
          size={48}
        />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text variant="callout" weight="semibold" numberOfLines={1} style={styles.name}>
              {contact.firstName} {contact.lastName}
            </Text>
            {lastMessage ? (
              <Text variant="caption" tone="muted">
                {formatRelative(lastMessage.createdAt)}
              </Text>
            ) : null}
          </View>
          <View style={styles.bottomRow}>
            <View style={[styles.channelDot, { backgroundColor: channelColor }]} />
            <Text variant="caption" tone="muted">
              {channelLabel}
            </Text>
            <Text variant="subhead" tone="muted" numberOfLines={1} style={styles.preview}>
              {lastMessage?.content ?? t('inbox.noMessages')}
            </Text>
            {unreadCount > 0 ? (
              <View style={styles.unread}>
                <Text variant="caption" weight="bold" color="#fff">
                  {unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  channelDot: { width: 7, height: 7, borderRadius: 3.5 },
  preview: { flex: 1 },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary500,
  },
});
