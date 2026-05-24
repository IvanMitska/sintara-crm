import { router, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActivityListItem } from '@/components/activities/ActivityListItem';
import { DealActionsBar } from '@/components/deals/DealActionsBar';
import { DealHeader } from '@/components/deals/DealHeader';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { TaskListItem } from '@/components/tasks/TaskListItem';
import { ScreenError, ScreenSkeleton, Segmented, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useCompleteTask } from '@/hooks/mutations';
import { useActivities, useDeal, useTasks } from '@/hooks/queries';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { formatDate } from '@/lib/format';
import { qk } from '@/lib/query';
import { colors, spacing } from '@/theme';

type Tab = 'overview' | 'activities' | 'tasks';

export default function DealDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: deal, isLoading, error, refetch } = useDeal(id);
  const activities = useActivities({ dealId: id, take: 50 });
  const tasks = useTasks({ dealId: id, take: 50 });
  const completeTask = useCompleteTask();

  // Real-time: подписка на комнату сделки (ТЗ §8.3).
  useSocketRoom('deal', id, {
    invalidateOn: {
      'activity:created': qk.activities.all,
      'task:created': qk.tasks.all,
    },
  });

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title={t('tabs.deals')} />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !deal) {
    return (
      <CosmicBg>
        <StackHeader title={t('tabs.deals')} />
        <ScreenError error={error} kind={deal ? 'error' : 'not-found'} onRetry={refetch} />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader
        title={deal.title}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
            hitSlop={10}
            onPress={() => router.push(`/(tabs)/deals/new?id=${deal.id}` as never)}
          >
            <Pencil size={20} color={colors.text.secondary} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DealHeader deal={deal} />

        <View style={styles.tabBar}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: t('deals.tabOverview') },
              { value: 'activities', label: t('deals.tabActivities') },
              { value: 'tasks', label: t('deals.tabTasks') },
            ]}
          />
        </View>

        <View style={styles.tabContent}>
          {tab === 'overview' ? (
            <GlassCard style={styles.card}>
              <InfoRow
                label={t('deals.contact')}
                value={
                  deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : null
                }
              />
              <InfoRow label={t('deals.company')} value={deal.company?.name} />
              <InfoRow
                label={t('deals.expectedDate')}
                value={deal.expectedDate ? formatDate(deal.expectedDate) : null}
              />
              <InfoRow label={t('deals.probability')} value={`${deal.probability}%`} />
              <InfoRow label={t('deals.description')} value={deal.description} />
              <InfoRow label={t('deals.createdAt')} value={formatDate(deal.createdAt)} />
            </GlassCard>
          ) : tab === 'activities' ? (
            <GlassCard style={styles.card}>
              {(activities.data ?? []).length === 0 ? (
                <Text variant="callout" tone="muted" center>
                  {t('deals.noActivities')}
                </Text>
              ) : (
                (activities.data ?? []).map((a) => (
                  <ActivityListItem key={a.id} activity={a} />
                ))
              )}
            </GlassCard>
          ) : (
            <View style={styles.taskList}>
              {(tasks.data?.data ?? []).length === 0 ? (
                <Text variant="callout" tone="muted" center>
                  {t('deals.noTasks')}
                </Text>
              ) : (
                (tasks.data?.data ?? []).map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onPress={() => router.push(`/(tabs)/more/tasks/${task.id}`)}
                    onToggle={() => completeTask.mutate(task.id)}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <DealActionsBar deal={deal} />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing[3], paddingBottom: spacing[4] },
  tabBar: { paddingHorizontal: spacing[4] },
  tabContent: { paddingHorizontal: spacing[4] },
  card: { padding: spacing[4] },
  taskList: { gap: spacing[2] },
});
