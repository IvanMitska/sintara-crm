import { ArrowRight } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DuplicateContactRef } from '@/api';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Button, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { useMergeContacts } from '@/hooks/mutations';
import { useContactDuplicates } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

function name(c: DuplicateContactRef): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

/** Поиск и объединение дубликатов контактов (ТЗ §8.6). */
export default function ContactDuplicatesScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useContactDuplicates();
  const merge = useMergeContacts();

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Дубликаты" />
        <ScreenSkeleton kind="list" />
      </CosmicBg>
    );
  }
  if (error) {
    return (
      <CosmicBg>
        <StackHeader title="Дубликаты" />
        <ScreenError error={error} onRetry={refetch} />
      </CosmicBg>
    );
  }

  const pairs = data ?? [];

  return (
    <CosmicBg>
      <StackHeader title="Дубликаты" />
      {pairs.length === 0 ? (
        <ScreenError kind="empty" message="Дубликатов не найдено 🎉" />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="callout" tone="muted">
            Найдено пар: {pairs.length}. Данные дубликата перейдут в основной
            контакт.
          </Text>
          {pairs.map((pair, i) => (
            <GlassCard key={`${pair.original.id}-${pair.duplicate.id}-${i}`} style={styles.card}>
              <View style={styles.pair}>
                <View style={styles.side}>
                  <Text variant="caption" tone="muted">
                    Основной
                  </Text>
                  <Text variant="callout" weight="semibold" numberOfLines={1}>
                    {name(pair.original)}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {pair.original.email ?? pair.original.phone ?? '—'}
                  </Text>
                </View>
                <ArrowRight size={18} color={colors.text.muted} />
                <View style={styles.side}>
                  <Text variant="caption" tone="muted">
                    Дубликат
                  </Text>
                  <Text variant="callout" weight="semibold" numberOfLines={1}>
                    {name(pair.duplicate)}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {pair.duplicate.email ?? pair.duplicate.phone ?? '—'}
                  </Text>
                </View>
              </View>
              <Text variant="caption" tone="muted">
                Совпадение по: {pair.matchedBy === 'email' ? 'email' : 'телефону'}
              </Text>
              <Button
                title="Объединить"
                variant="secondary"
                loading={merge.isPending}
                onPress={() =>
                  merge.mutate(
                    {
                      originalId: pair.original.id,
                      duplicateId: pair.duplicate.id,
                    },
                    {
                      onSuccess: () => toast.success('Контакты объединены'),
                      onError: () => toast.error('Не удалось объединить'),
                    },
                  )
                }
              />
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { padding: spacing[4], gap: spacing[3] },
  pair: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  side: { flex: 1, gap: 2 },
});
