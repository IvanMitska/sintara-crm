/** Команда: users + organizations/members. Сверено с контроллерами. */
import type { OrgMember, OrgRole, User } from '@/types';

import { api } from './client';

export interface UserStats {
  dealsCount: number;
  tasksCount: number;
  contactsCount: number;
  conversionRate?: number;
  [key: string]: unknown;
}

export const teamApi = {
  /** GET /users — сотрудники. */
  users: () => api.get<User[]>('/users').then((r) => r.data),

  /** GET /users/online — id онлайн-пользователей. */
  online: () => api.get<string[]>('/users/online').then((r) => r.data),

  /** GET /users/:id. */
  userById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),

  /** GET /users/:id/stats. */
  userStats: (id: string) =>
    api.get<UserStats>(`/users/${id}/stats`).then((r) => r.data),

  /** GET /organizations/current/members. */
  members: () =>
    api.get<OrgMember[]>('/organizations/current/members').then((r) => r.data),

  /** PATCH /users/:id/role — только ADMIN/OWNER. */
  changeRole: (id: string, role: OrgRole) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data),

  /** PATCH /users/:id/toggle-active. */
  toggleActive: (id: string) =>
    api.patch(`/users/${id}/toggle-active`).then((r) => r.data),
};
