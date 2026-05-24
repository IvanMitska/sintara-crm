import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { TasksFilter } from '@/api';
import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { TaskListItem } from '@/components/tasks/TaskListItem';
import { EntityList, Segmented } from '@/components/ui';
import { useCompleteTask } from '@/hooks/mutations';
import { useTasks } from '@/hooks/queries';
import { spacing } from '@/theme';
import type { Task } from '@/types';

type Segment = 'today' | 'week' | 'all' | 'overdue' | 'done';

function buildFilter(segment: Segment): TasksFilter {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const weekEnd = new Date(startOfDay);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const base: TasksFilter = { take: 50, sortBy: 'dueDate', sortOrder: 'asc' };
  switch (segment) {
    case 'today':
      return {
        ...base,
        dueDateFrom: startOfDay.toISOString(),
        dueDateTo: endOfDay.toISOString(),
      };
    case 'week':
      return {
        ...base,
        dueDateFrom: startOfDay.toISOString(),
        dueDateTo: weekEnd.toISOString(),
      };
    case 'overdue':
      return { ...base, overdue: true };
    case 'done':
      return { ...base, status: 'COMPLETED' };
    default:
      return base;
  }
}

/** Задачи (ТЗ §8.8): сегменты Сегодня · Неделя · Все · Просроченные · Завершённые. */
export default function TasksScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('today');

  const filter = useMemo(() => buildFilter(segment), [segment]);
  const { data, isLoading, isRefetching, error, refetch } = useTasks(filter);
  const completeTask = useCompleteTask();

  return (
    <CosmicBg>
      <StackHeader title={t('more.tasks')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentBar}
      >
        <View style={styles.segmentInner}>
          <Segmented<Segment>
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'today', label: 'Сегодня' },
              { value: 'week', label: 'Неделя' },
              { value: 'all', label: 'Все' },
              { value: 'overdue', label: 'Просроч.' },
              { value: 'done', label: 'Готово' },
            ]}
          />
        </View>
      </ScrollView>
      <EntityList<Task>
        data={data?.data ?? []}
        keyExtractor={(t2) => t2.id}
        estimatedItemSize={72}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText="Задач нет"
        renderItem={({ item }) => (
          <TaskListItem
            task={item}
            onPress={() => router.push(`/(tabs)/more/tasks/${item.id}`)}
            onToggle={() => completeTask.mutate(item.id)}
          />
        )}
      />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  segmentBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  segmentInner: { width: 420 },
});
