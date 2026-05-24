/**
 * Drawer профиля (ТЗ §7.3): пользователь, текущая организация,
 * переключение организаций, выход. Реализован как нижний лист.
 */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, LogOut } from 'lucide-react-native';
import { forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { organizationsApi } from '@/api/auth';
import { Avatar, Sheet, Text } from '@/components/ui';
import { qk } from '@/lib/query';
import { queryClient } from '@/lib/query';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { colors, radius, spacing } from '@/theme';

export const ProfileSheet = forwardRef<BottomSheetModal>(function ProfileSheet(_props, ref) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const logout = useAuthStore((s) => s.logout);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);

  const { data: orgs, isLoading } = useQuery({
    queryKey: qk.auth.organizations,
    queryFn: organizationsApi.my,
  });

  const onSwitch = useCallback(
    async (orgId: string) => {
      if (orgId === organization?.id) return;
      try {
        await switchOrganization(orgId);
        // Полная инвалидация кэша после смены организации (ТЗ §12).
        await queryClient.invalidateQueries();
        toast.success('Организация переключена');
      } catch {
        toast.error(t('common.error'));
      }
    },
    [organization?.id, switchOrganization, t],
  );

  return (
    <Sheet ref={ref}>
      <View style={styles.profile}>
        <Avatar
          uri={user?.avatar}
          firstName={user?.firstName}
          lastName={user?.lastName}
          size={56}
        />
        <View style={styles.profileText}>
          <Text variant="headline" weight="semibold">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </Text>
          <Text variant="subhead" tone="muted">
            {user?.email}
          </Text>
        </View>
      </View>

      <Text variant="subhead" weight="semibold" tone="secondary" style={styles.section}>
        {t('more.switchOrg')}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.brand.primary500} style={styles.loader} />
      ) : (
        <View style={styles.orgList}>
          {(orgs ?? []).map((org) => {
            const active = org.id === organization?.id;
            return (
              <Pressable
                key={org.id}
                accessibilityRole="button"
                onPress={() => onSwitch(org.id)}
                style={[styles.orgRow, active && styles.orgRowActive]}
              >
                <Building2 size={18} color={colors.text.muted} />
                <Text variant="body" weight="medium" style={styles.orgName}>
                  {org.name}
                </Text>
                {active ? <Check size={18} color={colors.brand.primary500} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => void logout()}
        style={styles.logout}
      >
        <LogOut size={18} color={colors.status.danger} />
        <Text variant="body" weight="semibold" color={colors.status.danger}>
          {t('more.logout')}
        </Text>
      </Pressable>
    </Sheet>
  );
});

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  profileText: { flex: 1, gap: 2 },
  section: { marginTop: spacing[5], marginBottom: spacing[2] },
  loader: { marginVertical: spacing[4] },
  orgList: { gap: spacing[1] },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  orgRowActive: { backgroundColor: 'rgba(139,92,246,0.16)' },
  orgName: { flex: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
});
