import { router } from 'expo-router';
import {
  Briefcase,
  Building2,
  CalendarClock,
  Contact,
  ListChecks,
  ScanLine,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { GlassCard } from '@/components/glass';
import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

interface QuickAction {
  key: string;
  /** Ключ i18n из namespace quickAdd. */
  labelKey: string;
  icon: LucideIcon;
  route: string | null;
}

/** Quick Add (ТЗ §7.1) → формы создания. */
const ACTIONS: QuickAction[] = [
  { key: 'lead', labelKey: 'quickAdd.lead', icon: UserPlus, route: '/(tabs)/deals/lead/new' },
  { key: 'deal', labelKey: 'quickAdd.deal', icon: Briefcase, route: '/(tabs)/deals/new' },
  { key: 'contact', labelKey: 'quickAdd.contact', icon: Contact, route: '/(tabs)/more/contacts/new' },
  { key: 'company', labelKey: 'quickAdd.company', icon: Building2, route: '/(tabs)/more/companies/new' },
  { key: 'task', labelKey: 'quickAdd.task', icon: ListChecks, route: '/(tabs)/more/tasks/new' },
  { key: 'activity', labelKey: 'quickAdd.activity', icon: ListChecks, route: '/(tabs)/more/activities/new' },
  { key: 'booking', labelKey: 'quickAdd.booking', icon: CalendarClock, route: '/(tabs)/more/booking/new' },
  { key: 'scan', labelKey: 'quickAdd.scan', icon: ScanLine, route: '/modal/scanner' },
];

export default function QuickAddScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <CosmicBg>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text variant="headline" weight="semibold" style={styles.title}>
          {t('quickAdd.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          hitSlop={10}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              onPress={() => {
                haptics.select();
                router.back();
                if (action.route) {
                  router.push(action.route as never);
                } else {
                  toast.info(t(action.labelKey), t('common.comingSoon'));
                }
              }}
            >
              <GlassCard style={styles.row}>
                <View style={styles.iconWrap}>
                  <Icon size={22} color={colors.brand.primary500} />
                </View>
                <Text variant="body" weight="medium">
                  {t(action.labelKey)}
                </Text>
              </GlassCard>
            </Pressable>
          );
        })}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  title: { flex: 1 },
  list: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
});
