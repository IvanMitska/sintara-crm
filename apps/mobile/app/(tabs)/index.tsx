import { router } from 'expo-router';
import { Briefcase, CircleCheck, MessageCircle, UserPlus } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FunnelBars } from '@/components/analytics/FunnelBars';
import { TAB_BAR_HEIGHT, Screen } from '@/components/layout';
import { LeadListItem } from '@/components/leads/LeadListItem';
import { TaskListItem } from '@/components/tasks/TaskListItem';
import {
  ScreenError,
  ScreenSkeleton,
  SectionHeader,
  StatCard,
  Text,
} from '@/components/ui';
import { useCompleteTask } from '@/hooks/mutations';
import {
  useDashboard,
  useFunnel,
  useLeads,
  useTodayTasks,
  useUnreadMessages,
} from '@/hooks/queries';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing } from '@/theme';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 6) return 'today.greetingNight';
  if (h < 12) return 'today.greetingMorning';
  if (h < 18) return 'today.greetingDay';
  return 'today.greetingEvening';
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const dashboard = useDashboard();
  const todayTasks = useTodayTasks();
  const freshLeads = useLeads({ take: 5, sortBy: 'createdAt', sortOrder: 'desc' });
  const funnel = useFunnel();
  const unreadMessages = useUnreadMessages();
  const completeTask = useCompleteTask();

  const refreshing =
    dashboard.isRefetching || todayTasks.isRefetching || freshLeads.isRefetching;

  const onRefresh = useCallback(() => {
    void dashboard.refetch();
    void todayTasks.refetch();
    void freshLeads.refetch();
    void funnel.refetch();
    void unreadMessages.refetch();
  }, [dashboard, todayTasks, freshLeads, funnel, unreadMessages]);

  if (dashboard.isLoading) {
    return (
      <Screen title={t('tabs.today')}>
        <ScreenSkeleton kind="today" />
      </Screen>
    );
  }

  if (dashboard.error) {
    return (
      <Screen title={t('tabs.today')}>
        <ScreenError error={dashboard.error} onRetry={() => dashboard.refetch()} />
      </Screen>
    );
  }

  const stats = dashboard.data;
  const tasks = todayTasks.data ?? [];
  const leads = freshLeads.data?.items ?? [];

  return (
    <Screen title={t('tabs.today')}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary500}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" weight="bold">
          {t(greetingKey())}, {user?.firstName} 👋
        </Text>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            icon={Briefcase}
            value={stats?.activeDeals ?? 0}
            label={t('today.statActiveDeals')}
            width={140}
          />
          <StatCard
            icon={CircleCheck}
            value={stats?.todayTasks ?? 0}
            label={t('today.statTodayTasks')}
            accent={colors.status.info}
            width={140}
          />
          <StatCard
            icon={UserPlus}
            value={stats?.recentContacts ?? 0}
            label={t('today.statNewContacts')}
            accent={colors.status.success}
            width={140}
          />
          <StatCard
            icon={MessageCircle}
            value={unreadMessages.data ?? 0}
            label={t('today.statUnread')}
            accent={colors.brand.accent500}
            width={140}
          />
        </ScrollView>

        {/* Задачи на сегодня */}
        <View style={styles.section}>
          <SectionHeader
            title={t('today.sectionTasks')}
            count={tasks.length}
            actionLabel={t('common.all')}
            onActionPress={() => router.push('/(tabs)/more/tasks')}
          />
          {tasks.length === 0 ? (
            <Text variant="callout" tone="muted">
              {t('today.noTasks')}
            </Text>
          ) : (
            tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onPress={() => router.push(`/(tabs)/more/tasks/${task.id}`)}
                onToggle={() => completeTask.mutate(task.id)}
              />
            ))
          )}
        </View>

        {/* Свежие лиды */}
        <View style={styles.section}>
          <SectionHeader
            title={t('today.sectionLeads')}
            actionLabel={t('common.all')}
            onActionPress={() => router.push('/(tabs)/deals')}
          />
          {leads.length === 0 ? (
            <Text variant="callout" tone="muted">
              {t('today.noLeads')}
            </Text>
          ) : (
            leads.map((lead) => (
              <LeadListItem
                key={lead.id}
                lead={lead}
                onPress={() => router.push(`/(tabs)/deals/lead/${lead.id}`)}
              />
            ))
          )}
        </View>

        {/* Сводка по воронке */}
        <View style={styles.section}>
          <SectionHeader title={t('today.sectionFunnel')} />
          <FunnelBars stages={funnel.data ?? []} loading={funnel.isLoading} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  statsRow: { gap: spacing[3], paddingVertical: spacing[1] },
  section: { gap: spacing[2] },
});
