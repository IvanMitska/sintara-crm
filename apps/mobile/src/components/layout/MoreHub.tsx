/**
 * Хаб «Ещё» (ТЗ §7.2): сетка разделов. Для OPERATOR скрыты Аналитика
 * и Команда (RBAC §13).
 */
import { router } from 'expo-router';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  Contact,
  ListChecks,
  Package,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Text } from '@/components/ui';
import { useCan } from '@/hooks/useCan';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';

interface HubItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  /** Право, без которого раздел скрыт. */
  requires?: 'analytics.view' | 'team.view';
}

const ITEMS: HubItem[] = [
  { key: 'contacts', labelKey: 'more.contacts', icon: Contact },
  { key: 'companies', labelKey: 'more.companies', icon: Building2 },
  { key: 'tasks', labelKey: 'more.tasks', icon: ListChecks },
  { key: 'products', labelKey: 'more.products', icon: Package },
  { key: 'team', labelKey: 'more.team', icon: Users, requires: 'team.view' },
  { key: 'booking', labelKey: 'more.booking', icon: CalendarClock },
  { key: 'automations', labelKey: 'more.automations', icon: Zap },
  { key: 'analytics', labelKey: 'more.analytics', icon: BarChart3, requires: 'analytics.view' },
  { key: 'activities', labelKey: 'more.activities', icon: Activity },
  { key: 'settings', labelKey: 'more.settings', icon: Settings },
];

function HubTile({ item }: { item: HubItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.tileWrap}
      onPress={() => {
        haptics.select();
        router.push(`/(tabs)/more/${item.key}`);
      }}
    >
      <GlassCard style={styles.tile}>
        <View style={styles.iconWrap}>
          <Icon size={24} color={colors.brand.primary500} />
        </View>
        <Text variant="subhead" weight="medium" center numberOfLines={1}>
          {t(item.labelKey)}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

export function MoreHub() {
  const canAnalytics = useCan('analytics.view');
  const canTeam = useCan('team.view');

  const visible = ITEMS.filter((i) => {
    if (i.requires === 'analytics.view') return canAnalytics;
    if (i.requires === 'team.view') return canTeam;
    return true;
  });

  return (
    <View style={styles.grid}>
      {visible.map((item) => (
        <HubTile key={item.key} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  tileWrap: { width: '31%' },
  tile: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
});
