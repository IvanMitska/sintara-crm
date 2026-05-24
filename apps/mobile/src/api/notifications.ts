/** Уведомления. Сверено с notifications.controller.ts. Списки — голые массивы. */
import type { AppNotification } from '@/types';

import { api } from './client';

export const notificationsApi = {
  /** GET /notifications — AppNotification[]. */
  list: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),

  /** GET /notifications/unread. */
  unread: () =>
    api.get<AppNotification[]>('/notifications/unread').then((r) => r.data),

  /** GET /notifications/unread/count — голое число. */
  unreadCount: () =>
    api.get<number>('/notifications/unread/count').then((r) => r.data),

  /** PATCH /notifications/:id/read. */
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  /** PATCH /notifications/read-all. */
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),

  /**
   * POST /notifications/devices — регистрация push-токена (ТЗ §10.1).
   * ⚠️ Эндпоинт добавляется на backend (§23.1). До его появления вернёт 404.
   */
  registerDevice: (payload: {
    token: string;
    platform: string;
    deviceModel?: string;
    appVersion?: string;
    locale?: string;
  }) => api.post('/notifications/devices', payload).then((r) => r.data),

  /** DELETE /notifications/devices/:token (ТЗ §23.2). */
  unregisterDevice: (token: string) =>
    api
      .delete(`/notifications/devices/${encodeURIComponent(token)}`)
      .then((r) => r.data),
};
