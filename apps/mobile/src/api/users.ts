/** Пользователь: профиль и настройки уведомлений. */
import type { User } from '@/types';

import { api } from './client';

export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

/** Настройки уведомлений (ТЗ §8.16.2). */
export interface NotificationPrefs {
  channels: { email: boolean; push: boolean; sms: boolean };
  types: {
    newDeals: boolean;
    newMessages: boolean;
    taskUpdates: boolean;
    reminders: boolean;
    system: boolean;
  };
  quietHours: { enabled: boolean; from: string; to: string };
}

export const usersApi = {
  /** PATCH /users/:id — обновление профиля (пользователь может править себя). */
  updateProfile: (id: string, data: ProfileInput) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  /**
   * PATCH /users/me/notification-prefs.
   * ⚠️ Эндпоинт добавляется на backend (ТЗ §23.3). До его появления вернёт 404 —
   * экран настроек обрабатывает это и хранит выбор локально.
   */
  updateNotificationPrefs: (prefs: NotificationPrefs) =>
    api.patch('/users/me/notification-prefs', prefs).then((r) => r.data),
};
