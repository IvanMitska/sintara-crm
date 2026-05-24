/** Воронки. Сверено с deals/pipelines.controller.ts. Мобильный — только чтение. */
import type { Pipeline } from '@/types';

import { api } from './client';

export const pipelinesApi = {
  /** GET /pipelines. */
  list: () => api.get<Pipeline[]>('/pipelines').then((r) => r.data),

  /** GET /pipelines/:id. */
  byId: (id: string) => api.get<Pipeline>(`/pipelines/${id}`).then((r) => r.data),
};
