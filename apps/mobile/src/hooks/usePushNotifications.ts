/**
 * Подключение push-уведомлений (ТЗ §10): регистрация устройства при входе,
 * обработка тапов по уведомлению → deep link. Монтируется в layout вкладок.
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { haptics } from '@/lib/haptics';
import { registerForPush, routeFromNotification } from '@/lib/push';

function openFromResponse(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const route = routeFromNotification(data);
  if (route) router.push(route as never);
}

export function usePushNotifications(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    void registerForPush();

    // Приложение открыто тапом по уведомлению из убитого состояния.
    void Notifications.getLastNotificationResponseAsync().then(openFromResponse);

    // Тап по уведомлению в фоне/foreground.
    const responseSub =
      Notifications.addNotificationResponseReceivedListener(openFromResponse);

    // Уведомление пришло, пока приложение открыто.
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      haptics.success();
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [enabled]);
}
