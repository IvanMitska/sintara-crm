/**
 * TanStack Query: клиент + MMKV-персистер (ТЗ §11.1).
 * staleTime 30s, gcTime 24h, кэш переживает рестарт приложения.
 */
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { querySyncStorage } from './storage';

const ONE_DAY = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: ONE_DAY,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: querySyncStorage,
  key: 'sintara-query-cache',
  throttleTime: 1000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: ONE_DAY,
  // Бамп при несовместимых изменениях схемы кэша.
  buster: 'v1',
};

/**
 * Централизованные queryKeys — переносятся с web (ТЗ §4.4).
 * Real-time события (§9.4) инвалидируют именно эти ключи.
 */
/** Параметры запроса как часть queryKey (любой объект-фильтр). */
type Params = object | undefined;

export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
    organizations: ['auth', 'organizations'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboard: ['analytics', 'dashboard'] as const,
    todayTasks: ['analytics', 'today-tasks'] as const,
    funnel: ['analytics', 'funnel'] as const,
    sales: (from: string, to: string) => ['analytics', 'sales', from, to] as const,
    activity: (days: number) => ['analytics', 'activity', days] as const,
  },
  deals: {
    all: ['deals'] as const,
    list: (p?: Params) => ['deals', 'list', p] as const,
    detail: (id: string) => ['deals', 'detail', id] as const,
    stats: (id: string) => ['deals', 'detail', id, 'stats'] as const,
    board: (pipelineId: string) => ['deals', 'board', pipelineId] as const,
  },
  pipelines: {
    all: ['pipelines'] as const,
    detail: (id: string) => ['pipelines', id] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (p?: Params) => ['leads', 'list', p] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    stats: ['leads', 'stats'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (p?: Params) => ['contacts', 'list', p] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
    stats: (id: string) => ['contacts', 'detail', id, 'stats'] as const,
    duplicates: ['contacts', 'duplicates'] as const,
  },
  companies: {
    all: ['companies'] as const,
    list: (p?: Params) => ['companies', 'list', p] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
    stats: (id: string) => ['companies', 'detail', id, 'stats'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (p?: Params) => ['tasks', 'list', p] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    stats: ['tasks', 'stats'] as const,
    calendar: (view: string, date?: string) => ['tasks', 'calendar', view, date] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: (p?: Params) => ['activities', 'list', p] as const,
  },
  products: {
    all: ['products'] as const,
    list: (p?: Params) => ['products', 'list', p] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  inbox: {
    all: ['messages'] as const,
    conversations: (p?: Params) => ['messages', 'conversations', p] as const,
    thread: (contactId: string) => ['messages', 'thread', contactId] as const,
    unread: ['messages', 'unread'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unread: ['notifications', 'unread'] as const,
    unreadCount: ['notifications', 'unread', 'count'] as const,
  },
  tags: { all: ['tags'] as const },
  team: {
    users: ['team', 'users'] as const,
    online: ['team', 'online'] as const,
    members: ['team', 'members'] as const,
    userStats: (id: string) => ['team', 'users', id, 'stats'] as const,
  },
  booking: {
    all: ['booking'] as const,
    resources: ['booking', 'resources'] as const,
    services: ['booking', 'services'] as const,
    schedule: (from: string, to: string) => ['booking', 'schedule', from, to] as const,
    stats: ['booking', 'stats'] as const,
  },
  automation: {
    all: ['automation'] as const,
    list: ['automation', 'list'] as const,
    detail: (id: string) => ['automation', id] as const,
  },
  search: (q: string) => ['search', q] as const,
} as const;
