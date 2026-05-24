import { router } from 'expo-router';
import {
  Bell,
  Building2,
  Globe,
  Info,
  Plug,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useCan } from '@/hooks/useCan';
import { useUiStore } from '@/store/ui.store';
import { spacing } from '@/theme';

const LOCALE_LABEL: Record<string, string> = { ru: 'Русский', en: 'English', th: 'ไทย' };

/** Хаб настроек (ТЗ §8.16). */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const locale = useUiStore((s) => s.locale);
  const canManageOrg = useCan('organization.manage');

  return (
    <CosmicBg>
      <StackHeader title={t('more.settings')} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.group}>
          <SettingsRow
            icon={UserIcon}
            title="Личные данные"
            onPress={() => router.push('/(tabs)/more/settings/profile')}
          />
          <SettingsRow
            icon={Bell}
            title="Уведомления"
            onPress={() => router.push('/(tabs)/more/settings/notifications')}
          />
          <SettingsRow
            icon={ShieldCheck}
            title="Безопасность"
            onPress={() => router.push('/(tabs)/more/settings/security')}
          />
          <SettingsRow
            icon={Globe}
            title="Язык"
            value={LOCALE_LABEL[locale]}
            onPress={() => router.push('/(tabs)/more/settings/language')}
          />
        </GlassCard>

        <GlassCard style={styles.group}>
          {canManageOrg ? (
            <SettingsRow
              icon={Plug}
              title="Интеграции"
              onPress={() => router.push('/(tabs)/more/settings/integrations')}
            />
          ) : null}
          <SettingsRow
            icon={Building2}
            title="Организация"
            onPress={() => router.push('/(tabs)/more/settings/organization')}
          />
          <SettingsRow
            icon={Info}
            title="О приложении"
            onPress={() => router.push('/(tabs)/more/settings/about')}
          />
        </GlassCard>
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  group: { paddingVertical: spacing[1] },
});
