import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, Input } from '@/components/ui';
import { pending2FA } from '@/lib/pending-2fa';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { spacing } from '@/theme';
import { isTwoFactorRequired } from '@/types';

export default function TwoFactorScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onVerify = async () => {
    const creds = pending2FA.get();
    if (!creds) {
      router.replace('/(auth)/sign-in');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login({ ...creds, twoFactorCode: code });
      if (isTwoFactorRequired(result)) {
        toast.error(t('auth.invalidCredentials'));
        return;
      }
      pending2FA.clear();
      // root-layout редиректит в (tabs).
    } catch (e) {
      toast.error(t('common.error'), normalizeError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={t('auth.twoFactorTitle')} subtitle={t('auth.twoFactorSubtitle')}>
      <View style={styles.form}>
        <Input
          label={t('auth.twoFactorCode')}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          style={styles.codeInput}
        />
        <Button
          title={t('auth.verify')}
          loading={submitting}
          disabled={code.length !== 6}
          onPress={onVerify}
        />
        <Button
          title={t('auth.backToSignIn')}
          variant="ghost"
          onPress={() => {
            pending2FA.clear();
            router.replace('/(auth)/sign-in');
          }}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 22 },
});
