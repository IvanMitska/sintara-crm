/** Задачи. Сверено с tasks.controller.ts. */
import type { ListResponse, Task, TaskPriority, TaskStatus } from '@/types';

import { api } from './client';

export interface TasksFilter {
  skip?: number;
  take?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    todayTasks: number;
    weekTasks: number;
    completionRate: number;
  };
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

/** GET /tasks/calendar — задачи, сгруппированные по дате. */
export interface CalendarTasks {
  startDate: string;
  endDate: string;
  view: string;
  tasks: Record<string, Task[]>;
  totalTasks: number;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  contactId?: string;
  dealId?: string;
}

export const tasksApi = {
  /** GET /tasks — { data, total, skip, take }. */
  list: (filter?: TasksFilter) =>
    api.get<ListResponse<Task>>('/tasks', { params: filter }).then((r) => r.data),

  /** GET /tasks/calendar?view=&date=. */
  calendar: (view?: string, date?: string) =>
    api
      .get<CalendarTasks>('/tasks/calendar', { params: { view, date } })
      .then((r) => r.data),

  /** GET /tasks/stats. */
  stats: () => api.get<TaskStats>('/tasks/stats').then((r) => r.data),

  /** GET /tasks/:id. */
  byId: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: TaskInput) => api.post<Task>('/tasks', data).then((r) => r.data),

  /** POST /tasks/recurring — повторяющаяся задача. pattern: daily|weekly|monthly. */
  createRecurring: (data: TaskInput & { pattern: string }) =>
    api.post<Task>('/tasks/recurring', data).then((r) => r.data),

  update: (id: string, data: Partial<TaskInput & { status: TaskStatus }>) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  /** POST /tasks/:id/complete. */
  complete: (id: string) =>
    api.post<Task>(`/tasks/${id}/complete`).then((r) => r.data),

  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
};
