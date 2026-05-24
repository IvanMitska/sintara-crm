/** Пузырь сообщения в диалоге. inbound — слева, outbound — справа. */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { Message } from '@/types';

export function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === 'outbound';

  return (
    <View style={[styles.row, outbound ? styles.rowOut : styles.rowIn]}>
      <View style={[styles.bubble, outbound ? styles.bubbleOut : styles.bubbleIn]}>
        <Text variant="callout" color={outbound ? '#fff' : colors.text.primary}>
          {message.content}
        </Text>
        <Text
          variant="caption"
          color={outbound ? 'rgba(255,255,255,0.7)' : colors.text.muted}
          style={styles.time}
        >
          {formatDateTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing[4], marginVertical: 3 },
  rowIn: { alignItems: 'flex-start' },
  rowOut: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', padding: spacing[3], borderRadius: radius.lg, gap: 3 },
  bubbleIn: {
    backgroundColor: colors.bg.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleOut: {
    backgroundColor: colors.brand.primary600,
    borderBottomRightRadius: radius.xs,
  },
  time: { alignSelf: 'flex-end' },
});
