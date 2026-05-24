/** Маркер отсутствия сети (ТЗ §11.1). Показывает кол-во операций в outbox. */
import { CloudOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { outboxSize } from '@/lib/offline-queue';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';

export function OfflineBanner() {
  const offline = useUiStore((s) => s.offline);
  if (!offline) return null;

  const pending = outboxSize();
  return (
    <View style={styles.banner}>
      <CloudOff size={14} color={colors.status.warning} />
      <Text variant="caption" weight="medium" color={colors.status.warning}>
        Нет сети{pending > 0 ? ` · в очереди: ${pending}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(245,158,11,0.14)',
  },
});
