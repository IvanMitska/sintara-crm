/**
 * Доменные сущности. Поля сверены с apps/backend/prisma/schema.prisma.
 * ВАЖНО: Prisma Decimal сериализуется в JSON строкой — amount/price: string.
 */
import type {
  BookingStatus,
  ContactSource,
  DealPriority,
  DealStatus,
  DealTemperature,
  LeadSource,
  LeadStatus,
  TaskPriority,
  TaskStatus,
} from './enums';

/** Облегчённая ссылка на пользователя (embedded в карточках). */
export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// ─── Pipelines ──────────────────────────────────────────────────────────────

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  pipelineId: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  stages?: Stage[];
}

/** Этап с агрегатами сделок (GET /deals/pipeline/:id). */
export interface StageWithDeals extends Stage {
  deals: Deal[];
  dealsCount: number;
  totalAmount: number;
}

export interface PipelineBoard {
  pipeline: Pipeline;
  stages: StageWithDeals[];
}

// ─── Deal ───────────────────────────────────────────────────────────────────

export interface DealNextTask {
  id: string;
  title: string;
  dueDate: string | null;
  isOverdue: boolean;
}

export interface Deal {
  id: string;
  title: string;
  amount: string; // Decimal → string
  currency: string;
  probability: number;
  expectedDate?: string | null;
  status: DealStatus;
  priority: DealPriority;
  temperature?: DealTemperature | null;
  tags: string[];
  description?: string | null;
  lastActivityAt?: string | null;
  stageId: string;
  stage?: Stage & { pipeline?: Pipeline };
  contactId?: string | null;
  contact?: Contact | null;
  companyId?: string | null;
  company?: Company | null;
  ownerId: string;
  owner?: UserRef | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Обогащённые поля из findAll:
  hasOverdueTasks?: boolean;
  overdueTasksCount?: number;
  openTasksCount?: number;
  nextTask?: DealNextTask | null;
  _count?: { products?: number; tasks?: number };
}

export interface DealProduct {
  id: string;
  dealId: string;
  productId: string;
  quantity: number;
  price: string;
  discount: string;
  product?: Product;
}

// ─── Lead ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  status: LeadStatus;
  description?: string | null;
  ownerId?: string | null;
  owner?: UserRef | null;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Contact ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  secondPhone?: string | null;
  position?: string | null;
  birthDate?: string | null;
  source: ContactSource;
  description?: string | null;
  tags?: Tag[];
  companyId?: string | null;
  company?: Company | null;
  ownerId: string;
  owner?: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Company ────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  industry?: string | null;
  size?: string | null;
  tags?: Tag[];
  ownerId: string;
  owner?: UserRef | null;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts?: number; deals?: number };
}

// ─── Task ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assignee?: UserRef | null;
  contactId?: string | null;
  contact?: Pick<Contact, 'id' | 'firstName' | 'lastName'> | null;
  dealId?: string | null;
  deal?: Pick<Deal, 'id' | 'title'> | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity ───────────────────────────────────────────────────────────────

/** type — строка: CALL | MEETING | NOTE | EMAIL | ... (бэкенд не типизирует). */
export interface Activity {
  id: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  userId: string;
  user?: Pick<UserRef, 'firstName' | 'lastName'> | null;
  contactId?: string | null;
  dealId?: string | null;
  createdAt: string;
}

// ─── Product ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price: string;
  currency: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  channel: string;
  direction: 'inbound' | 'outbound' | string;
  content: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  contactId: string;
  userId?: string | null;
  user?: Pick<UserRef, 'id' | 'firstName' | 'lastName'> | null;
  createdAt: string;
}

export interface Conversation {
  contactId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    avatar: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    channel: string;
    direction: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  lastChannel: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface ChannelStat {
  channel: string;
  count: number;
  unreadCount: number;
}

export interface ConversationThread {
  contact: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'phone' | 'email'>;
  messages: Message[];
  unreadCount: number;
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

// ─── Invitation (список приглашений организации) ────────────────────────────

export interface InvitationListItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

// ─── Booking (упрощённо, для просмотра) ─────────────────────────────────────

export interface Booking {
  id: string;
  title?: string | null;
  description?: string | null;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  notes?: string | null;
  contactId?: string | null;
  contact?: Pick<Contact, 'id' | 'firstName' | 'lastName'> | null;
  resourceId?: string;
  resource?: { id: string; name: string; color?: string } | null;
  serviceId?: string | null;
  service?: { id: string; name: string } | null;
  createdAt?: string;
}

// ─── Списочные ответы ───────────────────────────────────────────────────────

/** Универсальный ответ списка: deals/contacts/companies/tasks/products. */
export interface ListResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

/** Лиды используют иную форму (см. leads.service). */
export interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversationsResponse {
  data: Conversation[];
  total: number;
  channels: ChannelStat[];
}
