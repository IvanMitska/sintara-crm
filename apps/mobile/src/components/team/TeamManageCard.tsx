/** Управление сотрудником (ТЗ §8.10): смена роли, активация. Только ADMIN/OWNER. */
import { Pressable, StyleSheet, View } from 'react-native';

import { Can } from '@/components/auth/Can';
import { GlassCard } from '@/components/glass';
import { Button, Text } from '@/components/ui';
import { useChangeUserRole, useToggleUserActive } from '@/hooks/mutations';
import { toast } from '@/lib/toast';
import { colors, radius, spacing } from '@/theme';
import type { OrgRole, User } from '@/types';

const ROLES: { value: OrgRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Админ' },
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'OPERATOR', label: 'Оператор' },
];

export function TeamManageCard({ user }: { user: User }) {
  const changeRole = useChangeUserRole();
  const toggleActive = useToggleUserActive();

  return (
    <Can action="team.manage">
      <GlassCard style={styles.card}>
        <Text variant="subhead" weight="semibold" tone="secondary">
          Управление доступом
        </Text>

        <View style={styles.roles}>
          {ROLES.map((r) => {
            const active = r.value === user.role;
            return (
              <Pressable
                key={r.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                disabled={active || changeRole.isPending}
                onPress={() =>
                  changeRole.mutate(
                    { id: user.id, role: r.value },
                    {
                      onSuccess: () => toast.success(`Роль изменена: ${r.label}`),
                      onError: () => toast.error('Не удалось сменить роль'),
                    },
                  )
                }
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  variant="caption"
                  weight={active ? 'semibold' : 'medium'}
                  tone={active ? 'primary' : 'muted'}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={user.isActive ? 'Деактивировать' : 'Активировать'}
          variant={user.isActive ? 'danger' : 'secondary'}
          loading={toggleActive.isPending}
          onPress={() =>
            toggleActive.mutate(user.id, {
              onSuccess: () =>
                toast.success(user.isActive ? 'Деактивирован' : 'Активирован'),
              onError: () => toast.error('Ошибка'),
            })
          }
        />
      </GlassCard>
    </Can>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing[4], gap: spacing[3] },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[3],
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderColor: colors.border.strong,
  },
});
