import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { SupportedLocale } from '@/lib/i18n';
import { useUiStore } from '@/store/ui.store';
import { colors, spacing } from '@/theme';

const LOCALES: { value: SupportedLocale; label: string; native: string }[] = [
  { value: 'ru', label: 'Русский', native: 'Русский' },
  { value: 'en', label: 'English', native: 'English' },
  { value: 'th', label: 'Тайский', native: 'ไทย' },
];

/** Язык и регион (ТЗ §8.16.4). */
export default function LanguageSettingsScreen() {
  const locale = useUiStore((s) => s.locale);
  const changeLocale = useUiStore((s) => s.changeLocale);

  return (
    <CosmicBg>
      <StackHeader title="Язык" />
      <GlassCard style={styles.card}>
        {LOCALES.map((l) => {
          const active = l.value === locale;
          return (
            <Pressable
              key={l.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptics.select();
                changeLocale(l.value);
                router.back();
              }}
              style={styles.row}
            >
              <Text variant="body" weight={active ? 'semibold' : 'regular'} style={styles.label}>
                {l.native}
              </Text>
              {active ? <Check size={20} color={colors.brand.primary500} /> : null}
            </Pressable>
          );
        })}
      </GlassCard>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  card: { margin: spacing[4], paddingHorizontal: spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  label: { flex: 1 },
});
