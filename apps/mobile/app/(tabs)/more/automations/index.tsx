import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AutomationListItem } from '@/components/automations/AutomationListItem';
import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { EntityList } from '@/components/ui';
import { useAutomations, useToggleAutomation } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import type { Automation } from '@/types';

/** Автоматизации (ТЗ §8.11): список + вкл/выкл. Создание сценария — web-only. */
export default function AutomationsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, error, refetch } = useAutomations();
  const toggle = useToggleAutomation();

  return (
    <CosmicBg>
      <StackHeader title={t('more.automations')} />
      <EntityList<Automation>
        data={data ?? []}
        keyExtractor={(a) => a.id}
        estimatedItemSize={68}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText="Автоматизаций нет"
        renderItem={({ item }) => (
          <AutomationListItem
            automation={item}
            onPress={() => router.push(`/(tabs)/more/automations/${item.id}`)}
            onToggle={(isActive) =>
              toggle.mutate(
                { id: item.id, isActive },
                {
                  onSuccess: () =>
                    toast.success(isActive ? 'Включено' : 'Выключено'),
                  onError: () => toast.error(t('common.error')),
                },
              )
            }
          />
        )}
      />
    </CosmicBg>
  );
}
