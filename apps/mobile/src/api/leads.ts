/** Лиды. Сверено с leads.controller.ts. ВНИМАНИЕ: ответ — { items, total, page, limit }. */
import type { Lead, LeadSource, LeadStatus, LeadsResponse } from '@/types';

import { api } from './client';

export interface LeadsFilter {
  skip?: number;
  take?: number;
  search?: string;
  source?: LeadSource;
  status?: LeadStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}

export interface LeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  status?: LeadStatus;
  description?: string;
}

export const leadsApi = {
  /** GET /leads — { items, total, page, limit }. */
  list: (filter?: LeadsFilter) =>
    api.get<LeadsResponse>('/leads', { params: filter }).then((r) => r.data),

  /** GET /leads/stats. */
  stats: () => api.get<LeadStats>('/leads/stats').then((r) => r.data),

  /** GET /leads/:id. */
  byId: (id: string) => api.get<Lead>(`/leads/${id}`).then((r) => r.data),

  create: (data: LeadInput) => api.post<Lead>('/leads', data).then((r) => r.data),

  update: (id: string, data: Partial<LeadInput>) =>
    api.patch<Lead>(`/leads/${id}`, data).then((r) => r.data),

  /** POST /leads/:id/convert — создаёт Deal + Contact. */
  convert: (id: string) =>
    api.post(`/leads/${id}/convert`).then((r) => r.data),

  remove: (id: string) => api.delete(`/leads/${id}`).then((r) => r.data),
};
