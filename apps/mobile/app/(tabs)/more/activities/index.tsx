import { useTranslation } from 'react-i18next';

import { ActivityListItem } from '@/components/activities/ActivityListItem';
import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { EntityList } from '@/components/ui';
import { useActivities } from '@/hooks/queries';
import type { Activity } from '@/types';

/** Глобальный таймлайн активностей (ТЗ §8.14). */
export default function ActivitiesScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, error, refetch } = useActivities({ take: 50 });

  return (
    <CosmicBg>
      <StackHeader title={t('more.activities')} />
      <EntityList<Activity>
        data={data ?? []}
        keyExtractor={(a) => a.id}
        estimatedItemSize={64}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText="Активностей пока нет"
        renderItem={({ item }) => <ActivityListItem activity={item} />}
      />
    </CosmicBg>
  );
}
