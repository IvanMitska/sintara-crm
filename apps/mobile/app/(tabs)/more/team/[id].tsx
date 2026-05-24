import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { TeamManageCard } from '@/components/team/TeamManageCard';
import { Avatar, Badge, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useTeamUser, useUserStats } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { colors, spacing } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  OPERATOR: 'Оператор',
  SUPERVISOR: 'Супервайзер',
};

export default function TeamMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: user, isLoading, error, refetch } = useTeamUser(id);
  const stats = useUserStats(id);

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Сотрудник" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !user) {
    return (
      <CosmicBg>
        <StackHeader title="Сотрудник" />
        <ScreenError error={error} kind={user ? 'error' : 'not-found'} onRetry={refetch} />
      </CosmicBg>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <CosmicBg>
      <StackHeader title={fullName} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar
            uri={user.avatar}
            firstName={user.firstName}
            lastName={user.lastName}
            size={64}
          />
          <Text variant="title" weight="bold" center>
            {fullName}
          </Text>
          <Badge
            label={ROLE_LABEL[user.role] ?? user.role}
            color={user.isActive ? colors.brand.primary500 : colors.text.muted}
          />
        </View>

        {stats.data ? (
          <View style={styles.statsRow}>
            <Stat value={stats.data.dealsCount} label="Сделок" />
            <Stat value={stats.data.tasksCount} label="Задач" />
            <Stat value={stats.data.contactsCount} label="Контактов" />
          </View>
        ) : null}

        <GlassCard style={styles.card}>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Телефон" value={user.phone} />
          <InfoRow label="Статус" value={user.isActive ? 'Активен' : 'Деактивирован'} />
          <InfoRow
            label="Последний вход"
            value={user.lastLoginAt ? formatDate(user.lastLoginAt) : null}
          />
        </GlassCard>

        <TeamManageCard user={user} />
      </ScrollView>
    </CosmicBg>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard style={styles.stat}>
      <Text variant="headline" weight="bold" color={colors.brand.primary500}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  header: { alignItems: 'center', gap: spacing[2] },
  statsRow: { flexDirection: 'row', gap: spacing[2] },
  stat: { flex: 1, alignItems: 'center', padding: spacing[3], gap: 2 },
  card: { padding: spacing[4] },
});
