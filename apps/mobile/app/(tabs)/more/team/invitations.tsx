import { Mail, RotateCw, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  Input,
  ScreenError,
  ScreenSkeleton,
  Text,
} from '@/components/ui';
import {
  useCancelInvitation,
  useCreateInvitation,
  useResendInvitation,
} from '@/hooks/mutations';
import { useInvitations } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';
import { colors, radius, spacing } from '@/theme';

const ROLES = [
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'OPERATOR', label: 'Оператор' },
  { value: 'ADMIN', label: 'Админ' },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: colors.status.warning,
  ACCEPTED: colors.status.success,
  EXPIRED: colors.text.muted,
  CANCELLED: colors.status.danger,
};

/** Приглашения в команду (ТЗ §8.10, Фаза 3). Только ADMIN/OWNER. */
export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MANAGER');

  const invitations = useInvitations();
  const create = useCreateInvitation();
  const resend = useResendInvitation();
  const cancel = useCancelInvitation();

  const onInvite = () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      toast.error('Некорректный email');
      return;
    }
    create.mutate(
      { email: value, role },
      {
        onSuccess: () => {
          toast.success('Приглашение отправлено');
          setEmail('');
        },
        onError: () => toast.error('Не удалось отправить'),
      },
    );
  };

  return (
    <CosmicBg>
      <StackHeader title="Приглашения" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.form}>
          <Text variant="subhead" weight="semibold" tone="secondary">
            Пригласить сотрудника
          </Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="email@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.text.muted} />}
          />
          <View style={styles.roles}>
            {ROLES.map((r) => {
              const active = r.value === role;
              return (
                <Pressable
                  key={r.value}
                  accessibilityRole="button"
                  onPress={() => setRole(r.value)}
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
            title="Отправить приглашение"
            loading={create.isPending}
            onPress={onInvite}
          />
        </GlassCard>

        {invitations.isLoading ? (
          <ScreenSkeleton kind="list" />
        ) : invitations.error ? (
          <ScreenError error={invitations.error} onRetry={invitations.refetch} />
        ) : (
          (invitations.data ?? []).map((inv) => (
            <Card key={inv.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text variant="callout" weight="semibold" numberOfLines={1}>
                  {inv.email}
                </Text>
                <Text variant="caption" tone="muted">
                  {inv.role} · {formatDate(inv.createdAt)}
                </Text>
              </View>
              <Badge
                label={inv.status}
                color={STATUS_COLOR[inv.status] ?? colors.text.muted}
              />
              {inv.status === 'PENDING' ? (
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Повторить"
                    hitSlop={8}
                    onPress={() =>
                      resend.mutate(inv.id, {
                        onSuccess: () => toast.success('Отправлено повторно'),
                      })
                    }
                  >
                    <RotateCw size={18} color={colors.text.secondary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Отозвать"
                    hitSlop={8}
                    onPress={() =>
                      cancel.mutate(inv.id, {
                        onSuccess: () => toast.info('Приглашение отозвано'),
                      })
                    }
                  >
                    <X size={18} color={colors.status.danger} />
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  form: { padding: spacing[4], gap: spacing[3] },
  roles: { flexDirection: 'row', gap: spacing[2] },
  chip: {
    flex: 1,
    height: 36,
    alignItems: 'center',
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: 12 },
  rowBody: { flex: 1, gap: 2 },
  rowActions: { flexDirection: 'row', gap: spacing[3] },
});
