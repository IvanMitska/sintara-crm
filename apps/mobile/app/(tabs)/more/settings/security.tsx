import { Fingerprint, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/api';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Button, Input, Text } from '@/components/ui';
import { authenticateBiometric, isBiometricAvailable } from '@/lib/biometric';
import { saveRefreshToken } from '@/lib/secure';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';

/** Безопасность (ТЗ §8.16.3): 2FA + биометрия. */
export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const biometricEnabled = useUiStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useUiStore((s) => s.setBiometricEnabled);

  const [code, setCode] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const twoFAEnabled = user?.twoFactorEnabled ?? false;

  const onToggleBiometric = async (value: boolean) => {
    if (value) {
      if (!(await isBiometricAvailable())) {
        toast.error('Биометрия недоступна на устройстве');
        return;
      }
      if (!(await authenticateBiometric('Подтвердите включение биометрии'))) {
        return;
      }
    }
    setBiometricEnabled(value);
    // Перепривязываем refresh-токен к биометрии (ТЗ §12).
    if (refreshToken) {
      await saveRefreshToken(refreshToken, { biometricBound: value });
    }
    toast.success(value ? 'Биометрия включена' : 'Биометрия выключена');
  };

  const onEnable2FA = async () => {
    setBusy(true);
    try {
      const res = await authApi.enable2FA();
      setSecret(res.secret);
    } catch {
      toast.error('Не удалось начать настройку 2FA');
    } finally {
      setBusy(false);
    }
  };

  const onVerify2FA = async () => {
    setBusy(true);
    try {
      await authApi.verify2FA(code);
      if (user) setUser({ ...user, twoFactorEnabled: true });
      setSecret(null);
      setCode('');
      toast.success('2FA включена');
    } catch {
      toast.error('Неверный код');
    } finally {
      setBusy(false);
    }
  };

  const onDisable2FA = async () => {
    setBusy(true);
    try {
      await authApi.disable2FA(code);
      if (user) setUser({ ...user, twoFactorEnabled: false });
      setCode('');
      toast.success('2FA отключена');
    } catch {
      toast.error('Неверный код');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CosmicBg>
      <StackHeader title="Безопасность" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <Fingerprint size={20} color={colors.brand.primary500} />
            <View style={styles.rowBody}>
              <Text variant="body" weight="medium">
                Вход по биометрии
              </Text>
              <Text variant="caption" tone="muted">
                Face ID / Touch ID для быстрого входа
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(v) => void onToggleBiometric(v)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary600 }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <ShieldCheck size={20} color={colors.brand.primary500} />
            <View style={styles.rowBody}>
              <Text variant="body" weight="medium">
                Двухфакторная аутентификация
              </Text>
              <Text variant="caption" tone="muted">
                {twoFAEnabled ? 'Включена' : 'Дополнительная защита входа'}
              </Text>
            </View>
          </View>

          {!twoFAEnabled && !secret ? (
            <Button
              title="Включить 2FA"
              variant="secondary"
              loading={busy}
              onPress={onEnable2FA}
            />
          ) : null}

          {!twoFAEnabled && secret ? (
            <View style={styles.twoFa}>
              <Text variant="caption" tone="muted">
                Добавьте ключ в приложение-аутентификатор и введите код:
              </Text>
              <Text variant="callout" weight="semibold" selectable>
                {secret}
              </Text>
              <Input
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-значный код"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                title="Подтвердить"
                loading={busy}
                disabled={code.length !== 6}
                onPress={onVerify2FA}
              />
            </View>
          ) : null}

          {twoFAEnabled ? (
            <View style={styles.twoFa}>
              <Input
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="Код для отключения"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                title="Отключить 2FA"
                variant="danger"
                loading={busy}
                disabled={code.length !== 6}
                onPress={onDisable2FA}
              />
            </View>
          ) : null}
        </GlassCard>
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { padding: spacing[4], gap: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  rowBody: { flex: 1, gap: 2 },
  twoFa: { gap: spacing[2] },
});
