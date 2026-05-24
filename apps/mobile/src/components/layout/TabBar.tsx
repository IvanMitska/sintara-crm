/**
 * Кастомный таб-бар (ТЗ §7.1): 4 вкладки + центральная «+» (Quick Add).
 * Absolute + BlurView intensity 70 (§6.3).
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Briefcase,
  House,
  LayoutGrid,
  MessagesSquare,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { blur, colors, gradients, spacing } from '@/theme';

import { Text } from '../ui';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  deals: Briefcase,
  inbox: MessagesSquare,
  more: LayoutGrid,
};

const LABELS: Record<string, string> = {
  index: 'tabs.today',
  deals: 'tabs.deals',
  inbox: 'tabs.inbox',
  more: 'tabs.more',
};

const blurSupported = Platform.OS === 'ios' || (Platform.Version as number) >= 31;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Раскладка: первые две вкладки — слева, центр «+», последние две — справа.
  const left = state.routes.slice(0, 2);
  const right = state.routes.slice(2);

  const renderTab = (routeName: string, routeKey: string, index: number) => {
    const Icon = ICONS[routeName] ?? House;
    const focused = state.index === index;
    const label = descriptors[routeKey]?.options.tabBarLabel;

    return (
      <Pressable
        key={routeKey}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        style={styles.tab}
        onPress={() => {
          haptics.select();
          const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(routeName);
          }
        }}
      >
        <Icon
          size={24}
          color={focused ? colors.brand.primary500 : colors.text.muted}
          strokeWidth={focused ? 2.4 : 2}
        />
        <Text
          variant="caption"
          weight={focused ? 'semibold' : 'medium'}
          color={focused ? colors.brand.primary500 : colors.text.muted}
        >
          {typeof label === 'string' ? label : routeName}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {blurSupported ? (
        <BlurView intensity={blur.tabBar} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.opaque]} />
      )}
      <View style={styles.row}>
        {left.map((r, i) => renderTab(r.name, r.key, i))}

        <View style={styles.fabSlot}>
          <Pressable
            testID="quick-add-fab"
            accessibilityRole="button"
            accessibilityLabel="Создать"
            onPress={() => {
              haptics.impact();
              router.push('/modal/quick-add');
            }}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Plus size={26} color="#fff" strokeWidth={2.6} />
            </LinearGradient>
          </Pressable>
        </View>

        {right.map((r, i) => renderTab(r.name, r.key, i + 2))}
      </View>
    </View>
  );
}

export { LABELS as TAB_LABEL_KEYS };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    overflow: 'hidden',
  },
  opaque: { backgroundColor: colors.bg.sidebar },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: spacing[2],
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  fabSlot: { width: 72, alignItems: 'center' },
  fab: { marginTop: -28 },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg.base,
  },
});
