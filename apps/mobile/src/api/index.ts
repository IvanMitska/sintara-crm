/** Барель API-слоя. Эндпоинты 1:1 с apps/backend/src/modules/*. */
export { api, rawApi, normalizeError, configureApiAuth } from './client';
export type { ApiError } from './client';

export { authApi, invitationsApi, organizationsApi } from './auth';
export { analyticsApi } from './analytics';
export { dealsApi } from './deals';
export { pipelinesApi } from './pipelines';
export { leadsApi } from './leads';
export { contactsApi } from './contacts';
export { companiesApi } from './companies';
export { tasksApi } from './tasks';
export { activitiesApi } from './activities';
export { productsApi } from './products';
export { messagesApi } from './messages';
export { notificationsApi } from './notifications';
export { tagsApi } from './tags';
export { teamApi } from './team';
export { bookingApi } from './booking';
export { automationApi } from './automation';
export { integrationsApi } from './integrations';
export { usersApi } from './users';
export { globalSearch } from './search';

export type { DealsFilter, DealStats, DealInput } from './deals';
export type { LeadsFilter, LeadStats, LeadInput } from './leads';
export type {
  ContactsFilter,
  ContactStats,
  DuplicatePair,
  DuplicateContactRef,
  ImportResult,
} from './contacts';
export type { CompaniesFilter, CompanyStats } from './companies';
export type { TasksFilter, TaskStats, CalendarTasks, TaskInput } from './tasks';
export type { ActivitiesFilter, ActivityInput } from './activities';
export type { ProductsFilter, ProductInput } from './products';
export type { ConversationsFilter, SendMessagePayload } from './messages';
export type { UserStats } from './team';
export type { BookingInput } from './booking';
export type { Integration } from './integrations';
export type { ProfileInput, NotificationPrefs } from './users';
export type { SearchResults } from './search';
