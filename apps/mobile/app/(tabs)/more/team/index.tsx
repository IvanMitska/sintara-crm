import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Avatar, Badge, Card, EntityList, ScreenError, Text } from '@/components/ui';
import { useOnlineUsers, useTeamUsers } from '@/hooks/queries';
import { useCan } from '@/hooks/useCan';
import { colors } from '@/theme';
import type { User } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  OPERATOR: 'Оператор',
  SUPERVISOR: 'Супервайзер',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: colors.brand.purple500,
  MANAGER: colors.brand.primary500,
  OPERATOR: colors.text.muted,
  SUPERVISOR: colors.status.info,
};

/** Команда (ТЗ §8.10): список сотрудников + онлайн-статус. */
export default function TeamScreen() {
  const { t } = useTranslation();
  const canView = useCan('team.view');
  const canInvite = useCan('invitations.manage');
  const users = useTeamUsers();
  const online = useOnlineUsers();
  const onlineSet = new Set(online.data ?? []);

  if (!canView) {
    return (
      <CosmicBg>
        <StackHeader title={t('more.team')} />
        <ScreenError message="Раздел доступен менеджерам и администраторам" />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader
        title={t('more.team')}
        right={
          canInvite ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Пригласить"
              hitSlop={10}
              onPress={() => router.push('/(tabs)/more/team/invitations')}
            >
              <UserPlus size={20} color={colors.brand.primary500} />
            </Pressable>
          ) : undefined
        }
      />
      <EntityList<User>
        data={users.data ?? []}
        keyExtractor={(u) => u.id}
        estimatedItemSize={68}
        isLoading={users.isLoading}
        isRefetching={users.isRefetching}
        error={users.error}
        onRefresh={users.refetch}
        onRetry={users.refetch}
        emptyText="Сотрудников нет"
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push(`/(tabs)/more/team/${item.id}`)}
          >
            <View style={styles.row}>
              <Avatar
                uri={item.avatar}
                firstName={item.firstName}
                lastName={item.lastName}
                size={44}
                online={onlineSet.has(item.id)}
              />
              <View style={styles.body}>
                <Text variant="callout" weight="semibold" numberOfLines={1}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              <Badge
                label={ROLE_LABEL[item.role] ?? item.role}
                color={ROLE_COLOR[item.role] ?? colors.text.muted}
              />
            </View>
          </Card>
        )}
      />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
});
