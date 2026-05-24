/**
 * Query/mutation-хуки TanStack Query. Один хук = один query/mutation (ТЗ §24).
 * queryKeys централизованы в lib/query.ts (qk).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activitiesApi,
  analyticsApi,
  automationApi,
  bookingApi,
  companiesApi,
  contactsApi,
  dealsApi,
  globalSearch,
  integrationsApi,
  invitationsApi,
  leadsApi,
  messagesApi,
  notificationsApi,
  pipelinesApi,
  productsApi,
  tagsApi,
  tasksApi,
  teamApi,
} from '@/api';
import type {
  ActivitiesFilter,
  CompaniesFilter,
  ContactsFilter,
  DealsFilter,
  LeadsFilter,
  ProductsFilter,
  TasksFilter,
} from '@/api';
import type { ConversationsFilter } from '@/api/messages';
import { qk } from '@/lib/query';

// ─── Analytics ──────────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({ queryKey: qk.analytics.dashboard, queryFn: analyticsApi.dashboard });

export const useTodayTasks = () =>
  useQuery({ queryKey: qk.analytics.todayTasks, queryFn: analyticsApi.todayTasks });

export const useFunnel = () =>
  useQuery({ queryKey: qk.analytics.funnel, queryFn: analyticsApi.funnel });

export const useSalesAnalytics = (from: string, to: string) =>
  useQuery({
    queryKey: qk.analytics.sales(from, to),
    queryFn: () => analyticsApi.sales(from, to),
  });

export const useActivityAnalytics = (days: number) =>
  useQuery({
    queryKey: qk.analytics.activity(days),
    queryFn: () => analyticsApi.activity(days),
  });

// ─── Deals ──────────────────────────────────────────────────────────────────

export const useDeals = (filter?: DealsFilter) =>
  useQuery({
    queryKey: qk.deals.list(filter),
    queryFn: () => dealsApi.list(filter),
  });

export const useDeal = (id: string) =>
  useQuery({
    queryKey: qk.deals.detail(id),
    queryFn: () => dealsApi.byId(id),
    enabled: !!id,
  });

export const useDealStats = (id: string) =>
  useQuery({
    queryKey: qk.deals.stats(id),
    queryFn: () => dealsApi.stats(id),
    enabled: !!id,
  });

export const useDealBoard = (pipelineId: string | undefined) =>
  useQuery({
    queryKey: qk.deals.board(pipelineId ?? ''),
    queryFn: () => dealsApi.board(pipelineId!),
    enabled: !!pipelineId,
  });

// ─── Pipelines ──────────────────────────────────────────────────────────────

export const usePipelines = () =>
  useQuery({ queryKey: qk.pipelines.all, queryFn: pipelinesApi.list });

// ─── Leads ──────────────────────────────────────────────────────────────────

export const useLeads = (filter?: LeadsFilter) =>
  useQuery({ queryKey: qk.leads.list(filter), queryFn: () => leadsApi.list(filter) });

export const useLead = (id: string) =>
  useQuery({
    queryKey: qk.leads.detail(id),
    queryFn: () => leadsApi.byId(id),
    enabled: !!id,
  });

export const useLeadStats = () =>
  useQuery({ queryKey: qk.leads.stats, queryFn: leadsApi.stats });

// ─── Contacts ───────────────────────────────────────────────────────────────

export const useContacts = (filter?: ContactsFilter) =>
  useQuery({
    queryKey: qk.contacts.list(filter),
    queryFn: () => contactsApi.list(filter),
  });

export const useContact = (id: string) =>
  useQuery({
    queryKey: qk.contacts.detail(id),
    queryFn: () => contactsApi.byId(id),
    enabled: !!id,
  });

export const useContactStats = (id: string) =>
  useQuery({
    queryKey: qk.contacts.stats(id),
    queryFn: () => contactsApi.stats(id),
    enabled: !!id,
  });

export const useContactDuplicates = () =>
  useQuery({
    queryKey: qk.contacts.duplicates,
    queryFn: contactsApi.duplicates,
  });

// ─── Companies ──────────────────────────────────────────────────────────────

export const useCompanies = (filter?: CompaniesFilter) =>
  useQuery({
    queryKey: qk.companies.list(filter),
    queryFn: () => companiesApi.list(filter),
  });

export const useCompany = (id: string) =>
  useQuery({
    queryKey: qk.companies.detail(id),
    queryFn: () => companiesApi.byId(id),
    enabled: !!id,
  });

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const useTasks = (filter?: TasksFilter) =>
  useQuery({ queryKey: qk.tasks.list(filter), queryFn: () => tasksApi.list(filter) });

export const useTask = (id: string) =>
  useQuery({
    queryKey: qk.tasks.detail(id),
    queryFn: () => tasksApi.byId(id),
    enabled: !!id,
  });

export const useTaskStats = () =>
  useQuery({ queryKey: qk.tasks.stats, queryFn: tasksApi.stats });

export const useTaskCalendar = (view: string, date?: string) =>
  useQuery({
    queryKey: qk.tasks.calendar(view, date),
    queryFn: () => tasksApi.calendar(view, date),
  });

// ─── Activities ─────────────────────────────────────────────────────────────

export const useActivities = (filter?: ActivitiesFilter) =>
  useQuery({
    queryKey: qk.activities.list(filter),
    queryFn: () => activitiesApi.list(filter),
  });

// ─── Products ───────────────────────────────────────────────────────────────

export const useProducts = (filter?: ProductsFilter) =>
  useQuery({
    queryKey: qk.products.list(filter),
    queryFn: () => productsApi.list(filter),
  });

export const useProductDetail = (id: string) =>
  useQuery({
    queryKey: qk.products.detail(id),
    queryFn: () => productsApi.byId(id),
    enabled: !!id,
  });

// ─── Inbox ──────────────────────────────────────────────────────────────────

export const useConversations = (filter?: ConversationsFilter) =>
  useQuery({
    queryKey: qk.inbox.conversations(filter),
    queryFn: () => messagesApi.conversations(filter),
  });

export const useConversationThread = (contactId: string) =>
  useQuery({
    queryKey: qk.inbox.thread(contactId),
    queryFn: () => messagesApi.thread(contactId),
    enabled: !!contactId,
  });

export const useUnreadMessages = () =>
  useQuery({
    queryKey: qk.inbox.unread,
    queryFn: messagesApi.unreadStats,
    select: (d) => d.unreadCount,
  });

// ─── Notifications ──────────────────────────────────────────────────────────

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications.list, queryFn: notificationsApi.list });

export const useUnreadCount = () =>
  useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: notificationsApi.unreadCount,
  });

// ─── Tags ───────────────────────────────────────────────────────────────────

export const useTags = () =>
  useQuery({ queryKey: qk.tags.all, queryFn: tagsApi.list });

// ─── Team ───────────────────────────────────────────────────────────────────

export const useTeamUsers = () =>
  useQuery({ queryKey: qk.team.users, queryFn: teamApi.users });

export const useOnlineUsers = () =>
  useQuery({ queryKey: qk.team.online, queryFn: teamApi.online });

export const useTeamUser = (id: string) =>
  useQuery({
    queryKey: ['team', 'users', id, 'detail'],
    queryFn: () => teamApi.userById(id),
    enabled: !!id,
  });

export const useUserStats = (id: string) =>
  useQuery({
    queryKey: qk.team.userStats(id),
    queryFn: () => teamApi.userStats(id),
    enabled: !!id,
  });

export const useInvitations = () =>
  useQuery({ queryKey: ['invitations'], queryFn: invitationsApi.list });

// ─── Integrations ───────────────────────────────────────────────────────────

export const useIntegrations = () =>
  useQuery({ queryKey: ['integrations'], queryFn: integrationsApi.list });

// ─── Booking ────────────────────────────────────────────────────────────────

export const useResources = () =>
  useQuery({ queryKey: qk.booking.resources, queryFn: bookingApi.resources });

export const useServices = () =>
  useQuery({ queryKey: qk.booking.services, queryFn: bookingApi.services });

export const useSchedule = (from: string, to: string) =>
  useQuery({
    queryKey: qk.booking.schedule(from, to),
    queryFn: () => bookingApi.schedule(from, to),
  });

export const useBookingStats = () =>
  useQuery({ queryKey: qk.booking.stats, queryFn: () => bookingApi.stats() });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: ['booking', 'detail', id],
    queryFn: () => bookingApi.byId(id),
    enabled: !!id,
  });

// ─── Automations ────────────────────────────────────────────────────────────

export const useAutomations = () =>
  useQuery({ queryKey: qk.automation.list, queryFn: automationApi.list });

export const useAutomation = (id: string) =>
  useQuery({
    queryKey: qk.automation.detail(id),
    queryFn: () => automationApi.byId(id),
    enabled: !!id,
  });

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      automationApi.toggle(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.automation.all }),
  });
}

export function useExecuteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationApi.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.automation.all }),
  });
}

// ─── Search ─────────────────────────────────────────────────────────────────

export const useGlobalSearch = (query: string) =>
  useQuery({
    queryKey: qk.search(query),
    queryFn: () => globalSearch(query),
    enabled: query.trim().length >= 2,
  });

// ─── Mutations (минимум для чтения: пометка прочитанным) ────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useMarkThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => messagesApi.markThreadRead(contactId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.inbox.all }),
  });
}
