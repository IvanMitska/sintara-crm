/** Теги. Сверено с tags.controller.ts. */
import type { Tag } from '@/types';

import { api } from './client';

export const tagsApi = {
  /** GET /tags. */
  list: () => api.get<Tag[]>('/tags').then((r) => r.data),

  byId: (id: string) => api.get<Tag>(`/tags/${id}`).then((r) => r.data),

  create: (data: { name: string; color?: string }) =>
    api.post<Tag>('/tags', data).then((r) => r.data),

  update: (id: string, data: { name?: string; color?: string }) =>
    api.patch<Tag>(`/tags/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/tags/${id}`).then((r) => r.data),
};
