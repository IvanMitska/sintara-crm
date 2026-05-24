import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import { Linking, StyleSheet, View } from 'react-native';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Button, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing } from '@/theme';

/** О приложении (ТЗ §8.16.10). */
export default function AboutScreen() {
  const logout = useAuthStore((s) => s.logout);
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <CosmicBg>
      <StackHeader title="О приложении" />
      <View style={styles.content}>
        <View style={styles.brand}>
          <Text variant="display" weight="bold" color={colors.brand.primary500}>
            Sintara CRM
          </Text>
          <Text variant="callout" tone="muted">
            Версия {version} · {env.appEnv}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <InfoRow
            label="Политика конфиденциальности"
            value="Открыть"
            onPress={() => Linking.openURL('https://sintara.crm/privacy')}
          />
          <InfoRow
            label="Условия использования"
            value="Открыть"
            onPress={() => Linking.openURL('https://sintara.crm/terms')}
          />
        </GlassCard>

        <Button
          title="Выйти из аккаунта"
          variant="danger"
          icon={<LogOut size={18} color="#fff" />}
          onPress={() => void logout()}
        />
      </View>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[4], gap: spacing[4] },
  brand: { alignItems: 'center', gap: spacing[1], paddingVertical: spacing[6] },
  card: { padding: spacing[4] },
});
