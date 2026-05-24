import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/components/layout';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useAuthStore } from '@/store/auth.store';

export default function TabsLayout() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  // Глобальная real-time синхронизация кэша (ТЗ §9).
  useRealtimeSync(isAuthenticated);
  // Push-уведомления: регистрация устройства + deep links (ТЗ §10).
  usePushNotifications(isAuthenticated);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, lazy: true }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: t('tabs.today') }} />
      <Tabs.Screen name="deals" options={{ tabBarLabel: t('tabs.deals') }} />
      <Tabs.Screen name="inbox" options={{ tabBarLabel: t('tabs.inbox') }} />
      <Tabs.Screen name="more" options={{ tabBarLabel: t('tabs.more') }} />
    </Tabs>
  );
}
