import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { CircleCheck, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { normalizeError } from '@/api/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, Input, Text } from '@/components/ui';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

const schema = z.object({ email: z.string().email('Некорректный email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (e) {
      const err = normalizeError(e);
      // 404 — эндпоинт ещё не реализован (ТЗ §23.4). Сетевую ошибку показываем,
      // прочие — глотаем и показываем нейтральный успех (не раскрываем email).
      if (err.status === 0) {
        toast.error(t('common.errorOffline'));
      } else {
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title={t('auth.forgotTitle')}>
        <View style={styles.success}>
          <CircleCheck size={56} color={colors.status.success} strokeWidth={1.5} />
          <Text variant="body" tone="secondary" center>
            {t('auth.forgotSubtitle')}
          </Text>
          <Button
            title={t('auth.backToSignIn')}
            variant="secondary"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label={t('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.email?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={colors.text.muted} />}
            />
          )}
        />
        <Button
          title={t('auth.sendLink')}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
        <Button
          title={t('auth.backToSignIn')}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
  success: { alignItems: 'center', gap: spacing[5], paddingTop: spacing[6] },
});
