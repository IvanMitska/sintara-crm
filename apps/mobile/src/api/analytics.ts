/** Аналитика. Сверено с analytics.controller.ts (5 эндпоинтов). */
import type {
  ActivityAnalytics,
  DashboardStats,
  FunnelStage,
  SalesAnalytics,
  TodayTask,
} from '@/types';

import { api } from './client';

export const analyticsApi = {
  /** GET /analytics/dashboard. */
  dashboard: () => api.get<DashboardStats>('/analytics/dashboard').then((r) => r.data),

  /** GET /analytics/today-tasks. */
  todayTasks: () =>
    api.get<TodayTask[]>('/analytics/today-tasks').then((r) => r.data),

  /** GET /analytics/sales?startDate=&endDate=. */
  sales: (startDate: string, endDate: string) =>
    api
      .get<SalesAnalytics>('/analytics/sales', { params: { startDate, endDate } })
      .then((r) => r.data),

  /** GET /analytics/activity?days=. */
  activity: (days = 30) =>
    api
      .get<ActivityAnalytics>('/analytics/activity', { params: { days } })
      .then((r) => r.data),

  /** GET /analytics/funnel. */
  funnel: () => api.get<FunnelStage[]>('/analytics/funnel').then((r) => r.data),
};
