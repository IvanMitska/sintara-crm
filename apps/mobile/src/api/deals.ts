/** Сделки. Сверено с deals.controller.ts. Списки используют skip/take. */
import type {
  Deal,
  DealPriority,
  DealStatus,
  DealTemperature,
  ListResponse,
  PipelineBoard,
} from '@/types';

import { api } from './client';

export interface DealsFilter {
  skip?: number;
  take?: number;
  search?: string;
  status?: DealStatus;
  stageId?: string;
  pipelineId?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'amount' | 'expectedDate';
  sortOrder?: 'asc' | 'desc';
}

export interface DealStats {
  activitiesCount: number;
  tasksCount: number;
  messagesCount: number;
  productsCount: number;
  daysInPipeline: number;
  [key: string]: unknown;
}

export interface DealInput {
  title: string;
  amount: number;
  currency?: string;
  stageId: string;
  priority?: DealPriority;
  temperature?: DealTemperature;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  expectedDate?: string;
  tags?: string[];
}

export const dealsApi = {
  /** GET /deals — { data, total, skip, take }. */
  list: (filter?: DealsFilter) =>
    api.get<ListResponse<Deal>>('/deals', { params: filter }).then((r) => r.data),

  /** GET /deals/pipeline/:id — Kanban-доска. */
  board: (pipelineId: string) =>
    api.get<PipelineBoard>(`/deals/pipeline/${pipelineId}`).then((r) => r.data),

  /** GET /deals/:id. */
  byId: (id: string) => api.get<Deal>(`/deals/${id}`).then((r) => r.data),

  /** GET /deals/:id/stats. */
  stats: (id: string) =>
    api.get<DealStats>(`/deals/${id}/stats`).then((r) => r.data),

  create: (data: DealInput) => api.post<Deal>('/deals', data).then((r) => r.data),

  update: (id: string, data: Partial<DealInput>) =>
    api.patch<Deal>(`/deals/${id}`, data).then((r) => r.data),

  /** PATCH /deals/:id/move — { stageId }. */
  move: (id: string, stageId: string) =>
    api.patch<Deal>(`/deals/${id}/move`, { stageId }).then((r) => r.data),

  won: (id: string) => api.post<Deal>(`/deals/${id}/won`).then((r) => r.data),
  lost: (id: string) => api.post<Deal>(`/deals/${id}/lost`).then((r) => r.data),
  duplicate: (id: string) =>
    api.post<Deal>(`/deals/${id}/duplicate`).then((r) => r.data),
  remove: (id: string) => api.delete(`/deals/${id}`).then((r) => r.data),
};
