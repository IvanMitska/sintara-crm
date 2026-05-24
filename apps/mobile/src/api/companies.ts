/** Компании. Сверено с companies.controller.ts. */
import type { Company, ListResponse } from '@/types';

import { api } from './client';

export interface CompaniesFilter {
  skip?: number;
  take?: number;
  search?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyStats {
  contactsCount: number;
  dealsCount: number;
  [key: string]: unknown;
}

export const companiesApi = {
  /** GET /companies — { data, total, skip, take }. */
  list: (filter?: CompaniesFilter) =>
    api.get<ListResponse<Company>>('/companies', { params: filter }).then((r) => r.data),

  /** GET /companies/:id. */
  byId: (id: string) => api.get<Company>(`/companies/${id}`).then((r) => r.data),

  /** GET /companies/:id/stats. */
  stats: (id: string) =>
    api.get<CompanyStats>(`/companies/${id}/stats`).then((r) => r.data),

  create: (data: Partial<Company>) =>
    api.post<Company>('/companies', data).then((r) => r.data),

  update: (id: string, data: Partial<Company>) =>
    api.patch<Company>(`/companies/${id}`, data).then((r) => r.data),

  changeOwner: (id: string, ownerId: string) =>
    api.patch<Company>(`/companies/${id}/owner`, { ownerId }).then((r) => r.data),

  /** POST /companies/merge — body { originalId, duplicateId }. */
  merge: (originalId: string, duplicateId: string) =>
    api
      .post('/companies/merge', { originalId, duplicateId })
      .then((r) => r.data),

  remove: (id: string) => api.delete(`/companies/${id}`).then((r) => r.data),
};
