/**
 * Шапка экрана (ТЗ §7.3): слева аватар → drawer профиля, центр — заголовок,
 * справа — поиск + колокольчик уведомлений с бэйджем.
 */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Text } from '@/components/ui';
import { useUnreadCount } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing } from '@/theme';

import { OfflineBanner } from './OfflineBanner';
import { ProfileSheet } from './ProfileSheet';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profileRef = useRef<BottomSheetModal>(null);
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Профиль"
          hitSlop={8}
          onPress={() => profileRef.current?.present()}
        >
          <Avatar
            uri={user?.avatar}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size={36}
          />
        </Pressable>

        <Text variant="headline" weight="semibold" numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Поиск"
            hitSlop={8}
            onPress={() => router.push('/modal/global-search')}
          >
            <Search size={22} color={colors.text.secondary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Уведомления"
            hitSlop={8}
            onPress={() => router.push('/modal/notifications')}
          >
            <Bell size={22} color={colors.text.secondary} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text variant="caption" weight="bold" color="#fff">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <OfflineBanner />
      <ProfileSheet ref={profileRef} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  title: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.danger,
  },
});
