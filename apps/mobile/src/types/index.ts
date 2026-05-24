/** Доменные типы. Сверены с apps/backend/prisma/schema.prisma. */
import type { Currency, OrgRole, UserRole } from './enums';

export * from './enums';
export * from './entities';
export * from './analytics';
export * from './booking';

/** User без чувствительных полей (бэкенд возвращает sanitizeUser). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  organizationId: string | null;
  role: OrgRole;
  isActive: boolean;
  joinedAt: string;
  user?: User;
  organization?: Organization;
}

/** Ответ POST /auth/login | /auth/register | /auth/refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
  organization: Organization | null;
}

/** login возвращает это, когда у пользователя включена 2FA. */
export interface TwoFactorRequired {
  requiresTwoFactor: true;
  message: string;
}

export type LoginResult = AuthSession | TwoFactorRequired;

export function isTwoFactorRequired(r: LoginResult): r is TwoFactorRequired {
  return (r as TwoFactorRequired).requiresTwoFactor === true;
}

/** Данные приглашения (GET /invitations/token/:token). */
export interface InvitationPreview {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  organization: Pick<Organization, 'id' | 'name'> | null;
  invitedBy?: Pick<User, 'firstName' | 'lastName'> | null;
  expiresAt: string;
}

/** Универсальная форма списочного ответа (page/limit). */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
