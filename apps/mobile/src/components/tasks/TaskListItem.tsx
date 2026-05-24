/** Строка задачи: чекбокс, название, приоритет, срок, связь. */
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { colors, taskPriorityColor } from '@/theme';
import type { Task } from '@/types';

interface TaskListItemProps {
  task: Task;
  onPress?: () => void;
  /** Тап по чекбоксу (выполнить). */
  onToggle?: () => void;
}

export function TaskListItem({ task, onPress, onToggle }: TaskListItemProps) {
  const done = task.status === 'COMPLETED';
  const overdue =
    !done && !!task.dueDate && new Date(task.dueDate) < new Date();
  const priorityColor = taskPriorityColor[task.priority] ?? colors.text.muted;
  const related = task.deal?.title ?? task.contact?.firstName ?? null;

  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          hitSlop={10}
          onPress={() => {
            haptics.success();
            onToggle?.();
          }}
          style={[
            styles.checkbox,
            { borderColor: done ? colors.status.success : colors.border.strong },
            done && styles.checkboxDone,
          ]}
        >
          {done ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
        </Pressable>

        <View style={styles.body}>
          <Text
            variant="callout"
            weight="medium"
            numberOfLines={2}
            tone={done ? 'muted' : 'primary'}
            style={done ? styles.struck : undefined}
          >
            {task.title}
          </Text>
          <View style={styles.meta}>
            {task.dueDate ? (
              <Text
                variant="caption"
                color={overdue ? colors.status.danger : colors.text.muted}
              >
                {formatRelative(task.dueDate)}
              </Text>
            ) : null}
            {related ? (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                · {related}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.status.success },
  body: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  struck: { textDecorationLine: 'line-through' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
});
