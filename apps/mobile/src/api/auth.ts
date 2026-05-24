/** Auth-эндпоинты. Сверены с apps/backend/src/modules/auth/auth.controller.ts. */
import type {
  AuthSession,
  InvitationListItem,
  InvitationPreview,
  LoginResult,
  Organization,
  User,
} from '@/types';

import { api, rawApi } from './client';

export interface LoginPayload {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  organizationName: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const authApi = {
  /** POST /auth/login → AuthSession | { requiresTwoFactor }. */
  login: (payload: LoginPayload) =>
    api.post<LoginResult>('/auth/login', payload).then((r) => r.data),

  /** POST /auth/register → AuthSession. */
  register: (payload: RegisterPayload) =>
    api.post<AuthSession>('/auth/register', payload).then((r) => r.data),

  /** POST /auth/refresh — через rawApi, чтобы не зациклить интерсептор. */
  refresh: (refreshToken: string) =>
    rawApi
      .post<AuthSession>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  /** POST /auth/logout. */
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),

  /** GET /auth/me. */
  me: () => api.get<User>('/auth/me').then((r) => r.data),

  /** POST /auth/2fa/enable → { secret, qrCode }. */
  enable2FA: () =>
    api
      .post<{ secret: string; qrCode: string }>('/auth/2fa/enable')
      .then((r) => r.data),

  /** POST /auth/2fa/verify — body { code }. */
  verify2FA: (code: string) =>
    api.post('/auth/2fa/verify', { code }).then((r) => r.data),

  /** POST /auth/2fa/disable — body { code }. */
  disable2FA: (code: string) =>
    api.post('/auth/2fa/disable', { code }).then((r) => r.data),

  /** POST /auth/switch-organization. */
  switchOrganization: (organizationId: string) =>
    api
      .post<AuthSession>('/auth/switch-organization', { organizationId })
      .then((r) => r.data),

  /**
   * POST /auth/forgot-password. ⚠️ Эндпоинт добавляется на backend (ТЗ §23.4).
   * До его появления вернёт 404 — экран всё равно показывает нейтральное
   * сообщение, не раскрывая существование email.
   */
  forgotPassword: (email: string) =>
    rawApi.post('/auth/forgot-password', { email }).then((r) => r.data),
};

export const invitationsApi = {
  /** GET /invitations/token/:token — превью приглашения (публично). */
  getByToken: (token: string) =>
    rawApi
      .get<InvitationPreview>(`/invitations/token/${token}`)
      .then((r) => r.data),

  /** POST /invitations/accept → AuthSession. */
  accept: (payload: AcceptInvitationPayload) =>
    rawApi.post<AuthSession>('/invitations/accept', payload).then((r) => r.data),

  /** GET /invitations — список приглашений организации. */
  list: () =>
    api.get<InvitationListItem[]>('/invitations').then((r) => r.data),

  /** POST /invitations — создать приглашение { email, role? }. */
  create: (data: { email: string; role?: string }) =>
    api.post('/invitations', data).then((r) => r.data),

  /** POST /invitations/:id/resend. */
  resend: (id: string) =>
    api.post(`/invitations/${id}/resend`).then((r) => r.data),

  /** DELETE /invitations/:id — отозвать. */
  cancel: (id: string) => api.delete(`/invitations/${id}`).then((r) => r.data),
};

export const organizationsApi = {
  /** GET /organizations/my — организации текущего пользователя. */
  my: () => api.get<Organization[]>('/organizations/my').then((r) => r.data),

  /** GET /organizations/current. */
  current: () =>
    api.get<Organization>('/organizations/current').then((r) => r.data),

  /** PATCH /organizations/current — только ADMIN/OWNER. */
  updateCurrent: (data: Partial<Pick<Organization, 'name' | 'currency'>>) =>
    api.patch<Organization>('/organizations/current', data).then((r) => r.data),
};
