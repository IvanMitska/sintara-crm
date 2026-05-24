/** Активности. Сверено с activities.controller.ts. findAll возвращает голый массив. */
import type { Activity } from '@/types';

import { api } from './client';

export interface ActivitiesFilter {
  skip?: number;
  take?: number;
  type?: string;
  contactId?: string;
  dealId?: string;
}

export interface ActivityInput {
  type: string;
  description: string;
  contactId?: string;
  dealId?: string;
  metadata?: Record<string, unknown>;
}

export const activitiesApi = {
  /** GET /activities — Activity[] (без обёртки). */
  list: (filter?: ActivitiesFilter) =>
    api.get<Activity[]>('/activities', { params: filter }).then((r) => r.data),

  /** GET /activities/:id. */
  byId: (id: string) => api.get<Activity>(`/activities/${id}`).then((r) => r.data),

  create: (data: ActivityInput) =>
    api.post<Activity>('/activities', data).then((r) => r.data),

  update: (id: string, data: Partial<ActivityInput>) =>
    api.patch<Activity>(`/activities/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/activities/${id}`).then((r) => r.data),
};
