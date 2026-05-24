import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock, Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { invitationsApi } from '@/api/auth';
import { normalizeError } from '@/api/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlassCard } from '@/components/glass';
import { Button, Input, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing } from '@/theme';

const schema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  password: z.string().min(6, 'Минимум 6 символов'),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AcceptInviteScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const acceptInvitation = useAuthStore((s) => s.acceptInvitation);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: invite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => invitationsApi.getByToken(token!),
    enabled: !!token,
    retry: 0,
  });

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', password: '', phone: '' },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await acceptInvitation({ token, ...values });
      // root-layout редиректит в (tabs).
    } catch (e) {
      toast.error(t('common.error'), normalizeError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title={t('auth.acceptInviteTitle')}>
        <ScreenError kind="not-found" message="Ссылка приглашения недействительна" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.acceptInviteTitle')}>
      {isLoading ? (
        <ScreenSkeleton kind="detail" />
      ) : error || !invite ? (
        <ScreenError
          error={error}
          message="Приглашение не найдено или истекло"
          onRetry={() => router.replace('/(auth)/sign-in')}
        />
      ) : (
        <View style={styles.form}>
          <GlassCard style={styles.inviteCard}>
            <Text variant="callout" tone="secondary">
              {invite.email}
            </Text>
            <Text variant="headline" weight="semibold">
              {invite.organization?.name ?? '—'}
            </Text>
            <Text variant="subhead" tone="muted">
              Роль: {invite.role}
            </Text>
          </GlassCard>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label={t('auth.firstName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={formState.errors.firstName?.message}
                leftIcon={<User size={18} color={colors.text.muted} />}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label={t('auth.lastName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={formState.errors.lastName?.message}
                leftIcon={<User size={18} color={colors.text.muted} />}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label={t('auth.password')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={formState.errors.password?.message}
                secureTextEntry
                leftIcon={<Lock size={18} color={colors.text.muted} />}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Телефон"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                leftIcon={<Phone size={18} color={colors.text.muted} />}
              />
            )}
          />

          <Button
            title={t('auth.acceptInvite')}
            loading={submitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
  inviteCard: { padding: spacing[4], gap: 4 },
});
