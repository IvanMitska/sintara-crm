import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Fingerprint, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { normalizeError } from '@/api/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, Input, Text } from '@/components/ui';
import { authenticateBiometric, isBiometricAvailable } from '@/lib/biometric';
import { pending2FA } from '@/lib/pending-2fa';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';
import { isTwoFactorRequired } from '@/types';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const biometricEnabled = useUiStore((s) => s.biometricEnabled);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (biometricEnabled) {
      void isBiometricAvailable().then(setCanBiometric);
    }
  }, [biometricEnabled]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const result = await login(values);
      if (isTwoFactorRequired(result)) {
        pending2FA.set(values.email, values.password);
        router.push('/(auth)/two-factor');
      }
      // При успехе root-layout сам редиректит в (tabs).
    } catch (e) {
      const err = normalizeError(e);
      toast.error(
        err.status === 401 ? t('auth.invalidCredentials') : t('common.error'),
        err.status !== 401 ? err.message : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onBiometric = async () => {
    const ok = await authenticateBiometric(t('auth.biometricPrompt'));
    if (ok) await bootstrap();
  };

  return (
    <AuthLayout title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              testID="auth-email"
              label={t('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.email?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              leftIcon={<Mail size={18} color={colors.text.muted} />}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              testID="auth-password"
              label={t('auth.password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.password?.message}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              leftIcon={<Lock size={18} color={colors.text.muted} />}
              rightIcon={
                showPassword ? (
                  <EyeOff size={18} color={colors.text.muted} />
                ) : (
                  <Eye size={18} color={colors.text.muted} />
                )
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
          )}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable hitSlop={8} style={styles.forgot}>
            <Text variant="subhead" weight="medium" color={colors.brand.primary500}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        </Link>

        <Button
          testID="auth-submit"
          title={t('auth.signIn')}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />

        {canBiometric ? (
          <Button
            title={t('auth.biometricPrompt')}
            variant="secondary"
            icon={<Fingerprint size={18} color={colors.text.primary} />}
            onPress={onBiometric}
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text variant="callout" tone="secondary">
          {t('auth.noAccount')}{' '}
        </Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable hitSlop={8}>
            <Text variant="callout" weight="semibold" color={colors.brand.primary500}>
              {t('auth.signUp')}
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing[1] },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
