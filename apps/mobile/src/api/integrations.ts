/** Интеграции. Сверено с integrations.controller.ts. */
import { api } from './client';

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | string;
  icon: string;
}

export const integrationsApi = {
  /** GET /integrations — доступные интеграции и их статусы. */
  list: () => api.get<Integration[]>('/integrations').then((r) => r.data),

  /** GET /integrations/:id/status. */
  status: (id: string) =>
    api.get<{ status: string }>(`/integrations/${id}/status`).then((r) => r.data),

  /** POST /integrations/:id/connect — только ADMIN. */
  connect: (id: string, config: Record<string, unknown>) =>
    api.post(`/integrations/${id}/connect`, config).then((r) => r.data),

  /** DELETE /integrations/:id/disconnect — только ADMIN. */
  disconnect: (id: string) =>
    api.delete(`/integrations/${id}/disconnect`).then((r) => r.data),
};
