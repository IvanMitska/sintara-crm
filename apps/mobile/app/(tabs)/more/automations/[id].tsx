import { useLocalSearchParams } from 'expo-router';
import { Play } from 'lucide-react-native';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Button, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import {
  useAutomation,
  useExecuteAutomation,
  useToggleAutomation,
} from '@/hooks/queries';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <View style={styles.jsonBlock}>
      <Text variant="subhead" weight="semibold" tone="secondary">
        {title}
      </Text>
      <GlassCard style={styles.jsonCard}>
        <Text variant="caption" tone="secondary" style={styles.mono}>
          {JSON.stringify(value, null, 2)}
        </Text>
      </GlassCard>
    </View>
  );
}

export default function AutomationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: automation, isLoading, error, refetch } = useAutomation(id);
  const toggle = useToggleAutomation();
  const execute = useExecuteAutomation();

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Автоматизация" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !automation) {
    return (
      <CosmicBg>
        <StackHeader title="Автоматизация" />
        <ScreenError
          error={error}
          kind={automation ? 'error' : 'not-found'}
          onRetry={refetch}
        />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader title={automation.name} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" weight="bold">
          {automation.name}
        </Text>
        {automation.description ? (
          <Text variant="callout" tone="secondary">
            {automation.description}
          </Text>
        ) : null}

        <GlassCard style={styles.toggleCard}>
          <View>
            <Text variant="callout" weight="semibold">
              {automation.isActive ? 'Активна' : 'Выключена'}
            </Text>
            {automation.lastRunAt ? (
              <Text variant="caption" tone="muted">
                Последний запуск: {formatDateTime(automation.lastRunAt)}
              </Text>
            ) : null}
          </View>
          <Switch
            value={automation.isActive}
            onValueChange={(v) =>
              toggle.mutate(
                { id: automation.id, isActive: v },
                { onError: () => toast.error('Ошибка') },
              )
            }
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary600 }}
            thumbColor="#fff"
          />
        </GlassCard>

        <JsonBlock title="Триггер" value={automation.trigger} />
        <JsonBlock title="Условия" value={automation.conditions} />
        <JsonBlock title="Действия" value={automation.actions} />

        <Button
          title="Запустить вручную"
          variant="secondary"
          icon={<Play size={16} color={colors.text.primary} />}
          loading={execute.isPending}
          onPress={() =>
            execute.mutate(automation.id, {
              onSuccess: () => toast.success('Автоматизация запущена'),
              onError: () => toast.error('Не удалось запустить'),
            })
          }
        />

        <Text variant="caption" tone="muted" center>
          Создание и редактирование сценариев — в веб-версии Sintara CRM.
        </Text>
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  jsonBlock: { gap: spacing[1] },
  jsonCard: { padding: spacing[3] },
  mono: { fontFamily: 'Inter_400Regular' },
});
