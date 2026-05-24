/** Автоматизации. Сверено с automation.controller.ts. Мобильный — просмотр + вкл/выкл/запуск. */
import type { Automation } from '@/types';

import { api } from './client';

export const automationApi = {
  /** GET /automation — Automation[]. */
  list: () => api.get<Automation[]>('/automation').then((r) => r.data),

  /** GET /automation/active. */
  active: () => api.get<Automation[]>('/automation/active').then((r) => r.data),

  /** GET /automation/:id. */
  byId: (id: string) => api.get<Automation>(`/automation/${id}`).then((r) => r.data),

  /** PATCH /automation/:id — вкл/выкл. */
  toggle: (id: string, isActive: boolean) =>
    api.patch<Automation>(`/automation/${id}`, { isActive }).then((r) => r.data),

  /** POST /automation/:id/execute — ручной запуск. */
  execute: (id: string) =>
    api.post(`/automation/${id}/execute`).then((r) => r.data),
};
