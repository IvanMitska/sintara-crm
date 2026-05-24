/** Типы аналитики. Сверены с apps/backend/.../analytics.service.ts. */
import type { Activity, Contact, Task } from './entities';

/** GET /analytics/funnel — этапы воронки конверсии. */
export interface FunnelStage {
  id: string;
  name: string;
  color: string;
  dealsCount: number;
  totalAmount: number;
}

/** GET /analytics/dashboard. */
export interface DashboardStats {
  totalContacts: number;
  totalDeals: number;
  totalTasks: number;
  totalCompanies: number;
  activeDeals: number;
  totalDealsAmount: number;
  pendingTasks: number;
  todayTasks: number;
  highPriorityTasks: number;
  recentContacts: number;
  dealsAddedToday: number;
  recentActivities: Activity[];
  funnel: FunnelStage[];
}

/** GET /analytics/today-tasks. */
export type TodayTask = Task & {
  contact?: Pick<Contact, 'firstName' | 'lastName'> | null;
};

/** GET /analytics/sales. */
export interface SalesAnalytics {
  totalDeals: number;
  totalAmount: number;
  averageAmount: number;
  dealsByStage: Record<string, number>;
}

/** GET /analytics/activity. */
export interface ActivityAnalytics {
  total: number;
  byType: Record<string, number>;
  byDay: Record<string, number>;
}
