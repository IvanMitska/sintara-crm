import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Avatar, Badge, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useTask } from '@/hooks/queries';
import { formatDateTime } from '@/lib/format';
import { spacing, taskPriorityColor, taskStatusColor } from '@/theme';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочно',
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: task, isLoading, error, refetch } = useTask(id);

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Задача" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !task) {
    return (
      <CosmicBg>
        <StackHeader title="Задача" />
        <ScreenError error={error} kind={task ? 'error' : 'not-found'} onRetry={refetch} />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader title={task.title} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" weight="bold">
          {task.title}
        </Text>
        <View style={styles.badges}>
          <Badge
            label={STATUS_LABEL[task.status] ?? task.status}
            color={taskStatusColor[task.status] ?? '#888'}
          />
          <Badge
            label={PRIORITY_LABEL[task.priority] ?? task.priority}
            color={taskPriorityColor[task.priority] ?? '#888'}
            pulse={task.priority === 'URGENT'}
          />
        </View>

        <GlassCard style={styles.card}>
          <InfoRow
            label="Срок"
            value={task.dueDate ? formatDateTime(task.dueDate) : 'Без срока'}
          />
          <InfoRow label="Описание" value={task.description} />
          <InfoRow label="Сделка" value={task.deal?.title} />
          <InfoRow
            label="Контакт"
            value={
              task.contact ? `${task.contact.firstName} ${task.contact.lastName}` : null
            }
          />
        </GlassCard>

        {task.assignee ? (
          <View style={styles.assignee}>
            <Avatar
              uri={task.assignee.avatar}
              firstName={task.assignee.firstName}
              lastName={task.assignee.lastName}
              size={32}
            />
            <Text variant="subhead" tone="secondary">
              Исполнитель: {task.assignee.firstName} {task.assignee.lastName}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  badges: { flexDirection: 'row', gap: spacing[2] },
  card: { padding: spacing[4] },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
