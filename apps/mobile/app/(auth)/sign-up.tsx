import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Stack } from 'expo-router';
import { Building2, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { normalizeError } from '@/api/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, Input, Text } from '@/components/ui';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { colors, radius, spacing } from '@/theme';
import type { Currency } from '@/types';

const CURRENCIES: Currency[] = ['THB', 'RUB', 'USD', 'EUR'];

const schema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  organizationName: z.string().min(2, 'Укажите название организации'),
});
type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);
  // currency собирается отдельно — backend RegisterDto его не принимает,
  // организация создаётся с дефолтной валютой THB и меняется в Настройках.
  const [currency, setCurrency] = useState<Currency>('THB');

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      organizationName: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await register(values);
      // root-layout редиректит в (tabs).
    } catch (e) {
      toast.error(t('common.error'), normalizeError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')}>
      <Stack.Screen options={{ title: t('auth.registerTitle') }} />
      <View style={styles.form}>
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
          name="organizationName"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label={t('auth.organizationName')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.organizationName?.message}
              leftIcon={<Building2 size={18} color={colors.text.muted} />}
            />
          )}
        />

        <View style={styles.currencyBlock}>
          <Text variant="subhead" weight="medium" tone="secondary">
            {t('auth.currency')}
          </Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => {
              const active = c === currency;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCurrency(c)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    variant="callout"
                    weight={active ? 'semibold' : 'medium'}
                    tone={active ? 'primary' : 'muted'}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title={t('auth.register')}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="callout" tone="secondary">
          {t('auth.haveAccount')}{' '}
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable hitSlop={8}>
            <Text variant="callout" weight="semibold" color={colors.brand.primary500}>
              {t('auth.signIn')}
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
  currencyBlock: { gap: spacing[2] },
  currencyRow: { flexDirection: 'row', gap: spacing[2] },
  chip: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderColor: colors.border.strong,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
