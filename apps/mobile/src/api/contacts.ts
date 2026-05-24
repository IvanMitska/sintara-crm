/** Контакты. Сверено с contacts.controller.ts. */
import type { Contact, ContactSource, ListResponse } from '@/types';

import { api } from './client';

export interface ContactsFilter {
  skip?: number;
  take?: number;
  search?: string;
  source?: ContactSource;
  companyId?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactStats {
  dealsCount: number;
  tasksCount: number;
  activitiesCount: number;
  messagesCount: number;
  [key: string]: unknown;
}

/** Облегчённая запись контакта в паре дубликатов. */
export interface DuplicateContactRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

/** Пара дубликатов (GET /contacts/duplicates). */
export interface DuplicatePair {
  original: DuplicateContactRef;
  duplicate: DuplicateContactRef;
  matchedBy: string;
}

/** Результат импорта (POST /contacts/import). */
export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: { row: number; error: string }[];
}

export const contactsApi = {
  /** GET /contacts — { data, total, skip, take }. */
  list: (filter?: ContactsFilter) =>
    api.get<ListResponse<Contact>>('/contacts', { params: filter }).then((r) => r.data),

  /** GET /contacts/:id. */
  byId: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),

  /** GET /contacts/:id/stats. */
  stats: (id: string) =>
    api.get<ContactStats>(`/contacts/${id}/stats`).then((r) => r.data),

  /** GET /contacts/duplicates. */
  duplicates: () =>
    api.get<DuplicatePair[]>('/contacts/duplicates').then((r) => r.data),

  /** POST /contacts/merge — body { originalId, duplicateId }. */
  merge: (originalId: string, duplicateId: string) =>
    api
      .post('/contacts/merge', { originalId, duplicateId })
      .then((r) => r.data),

  create: (data: Partial<Contact>) =>
    api.post<Contact>('/contacts', data).then((r) => r.data),

  update: (id: string, data: Partial<Contact>) =>
    api.patch<Contact>(`/contacts/${id}`, data).then((r) => r.data),

  /** PATCH /contacts/:id/owner. */
  changeOwner: (id: string, ownerId: string) =>
    api.patch<Contact>(`/contacts/${id}/owner`, { ownerId }).then((r) => r.data),

  remove: (id: string) => api.delete(`/contacts/${id}`).then((r) => r.data),

  /** POST /contacts/import — multipart CSV/XLSX. */
  importFile: (file: { uri: string; name: string; mimeType: string }) => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
    return api
      .post<ImportResult>('/contacts/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /** GET /contacts/export — XLSX-файл (бинарь). */
  exportRaw: () =>
    api
      .get<ArrayBuffer>('/contacts/export', { responseType: 'arraybuffer' })
      .then((r) => r.data),
};
