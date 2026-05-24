/**
 * Push-уведомления (ТЗ §10). Регистрация устройства, каналы Android,
 * foreground-баннер, deep links из data.url.
 *
 * ⚠️ Регистрация устройства обращается к POST /notifications/devices —
 * эндпоинт добавляется на backend (ТЗ §23.1). До его появления вызов
 * молча проглатывает 404, остальная логика push работает.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationsApi } from '@/api';
import { getLocale } from '@/lib/i18n';

/** Foreground-поведение: показываем баннер + список, без счётчика бейджа. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android-каналы (ТЗ §10.3). */
async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Обновления',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync('high', {
    name: 'Важное',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Сообщения клиентов',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

/**
 * Запрашивает разрешение, получает Expo push-токен и регистрирует устройство.
 * Возвращает токен или null. Безопасна к повторным вызовам.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // на эмуляторе push недоступен

  await ensureAndroidChannels();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = getProjectId();
  if (!projectId) {
    // EAS-проект ещё не инициализирован (`eas init`) — токен получить нельзя.
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await notificationsApi.registerDevice({
      token,
      platform: Platform.OS,
      deviceModel: Device.modelName ?? undefined,
      appVersion: Constants.expoConfig?.version ?? undefined,
      locale: getLocale(),
    });
    return token;
  } catch {
    // 404 (эндпоинт §23.1 ещё не реализован) либо сетевая ошибка — не критично.
    return null;
  }
}

/** Снятие устройства с регистрации при выходе. */
export async function unregisterPush(): Promise<void> {
  try {
    const projectId = getProjectId();
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await notificationsApi.unregisterDevice(token);
  } catch {
    // игнорируем — не блокируем logout
  }
}

/**
 * Извлекает целевой роут из payload уведомления (ТЗ §10.2: data.url).
 * Поддерживает схему sintara:// и абсолютные пути.
 */
export function routeFromNotification(
  data: Record<string, unknown> | undefined,
): string | null {
  const url = data?.url;
  if (typeof url !== 'string') return null;
  // sintara://deals/abc → /deals/abc (группа (tabs) прозрачна в URL)
  return url.replace(/^sintara:\/\//, '/');
}
