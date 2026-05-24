/**
 * Auth-стор (zustand). Источник истины сессии: accessToken в памяти + MMKV,
 * refreshToken в SecureStore (ТЗ §12). Подключает себя к axios-клиенту через
 * configureApiAuth — циклического импорта нет (client.ts ничего не импортирует
 * из стора).
 */
import { create } from 'zustand';

import { authApi, invitationsApi } from '@/api/auth';
import type {
  AcceptInvitationPayload,
  LoginPayload,
  RegisterPayload,
} from '@/api/auth';
import { configureApiAuth } from '@/api/client';
import { unregisterPush } from '@/lib/push';
import {
  clearRefreshToken,
  getRefreshToken,
  saveRefreshToken,
} from '@/lib/secure';
import { connectSocket, disconnectSocket, updateSocketToken } from '@/lib/socket';
import { kv } from '@/lib/storage';
import type {
  AuthSession,
  LoginResult,
  Organization,
  OrgRole,
  User,
  UserRole,
} from '@/types';
import { isTwoFactorRequired } from '@/types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

const K_ACCESS = 'auth.accessToken';
const K_USER = 'auth.user';
const K_ORG = 'auth.organization';
const K_BIOMETRIC = 'app.biometricEnabled';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;

  /** Старт приложения: восстановить сессию из хранилищ. */
  bootstrap: () => Promise<void>;
  /** Вход. Возвращает результат для обработки 2FA на экране. */
  login: (payload: LoginPayload) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<void>;
  acceptInvitation: (payload: AcceptInvitationPayload) => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;

  /** Текущая глобальная роль пользователя (для RBAC). */
  userRole: () => UserRole | null;
  /** Роль в текущей организации (вычисляется лениво, обновляется при /me). */
  orgRole: OrgRole | null;
}

/** Записать сессию во все хранилища + обновить сокет. */
async function persistSession(session: AuthSession): Promise<void> {
  kv.setString(K_ACCESS, session.accessToken);
  kv.setJSON(K_USER, session.user);
  if (session.organization) kv.setJSON(K_ORG, session.organization);
  await saveRefreshToken(session.refreshToken, {
    biometricBound: kv.getBool(K_BIOMETRIC),
  });
  updateSocketToken(session.accessToken);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  organization: null,
  accessToken: null,
  refreshToken: null,
  orgRole: null,

  userRole: () => get().user?.role ?? null,

  bootstrap: async () => {
    set({ status: 'loading' });

    const accessToken = kv.getString(K_ACCESS) ?? null;
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      set({ status: 'unauthenticated' });
      return;
    }

    // Оптимистично поднимаем кэшированную сессию (offline-tolerant, ТЗ §11).
    const cachedUser = kv.getJSON<User>(K_USER) ?? null;
    const cachedOrg = kv.getJSON<Organization>(K_ORG) ?? null;
    set({
      accessToken,
      refreshToken,
      user: cachedUser,
      organization: cachedOrg,
      status: cachedUser ? 'authenticated' : 'loading',
    });

    if (accessToken) connectSocket(accessToken);

    // Фоновая валидация: /auth/me. На 401 интерсептор сам сделает refresh.
    try {
      const fresh = await authApi.me();
      kv.setJSON(K_USER, fresh);
      set({ user: fresh, status: 'authenticated' });
    } catch {
      // Сеть недоступна — остаёмся на кэше. Полный провал авторизации
      // приведёт к onAuthFailure → logout через интерсептор.
      if (!cachedUser) set({ status: 'unauthenticated' });
    }
  },

  login: async (payload) => {
    set({ status: 'loading' });
    try {
      const result = await authApi.login(payload);
      if (isTwoFactorRequired(result)) {
        set({ status: 'unauthenticated' });
        return result;
      }
      await persistSession(result);
      connectSocket(result.accessToken);
      set({
        status: 'authenticated',
        user: result.user,
        organization: result.organization,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return result;
    } catch (e) {
      set({ status: 'unauthenticated' });
      throw e;
    }
  },

  register: async (payload) => {
    set({ status: 'loading' });
    try {
      const session = await authApi.register(payload);
      await persistSession(session);
      connectSocket(session.accessToken);
      set({
        status: 'authenticated',
        user: session.user,
        organization: session.organization,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } catch (e) {
      set({ status: 'unauthenticated' });
      throw e;
    }
  },

  acceptInvitation: async (payload) => {
    set({ status: 'loading' });
    try {
      const session = await invitationsApi.accept(payload);
      await persistSession(session);
      connectSocket(session.accessToken);
      set({
        status: 'authenticated',
        user: session.user,
        organization: session.organization,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } catch (e) {
      set({ status: 'unauthenticated' });
      throw e;
    }
  },

  switchOrganization: async (organizationId) => {
    const session = await authApi.switchOrganization(organizationId);
    await persistSession(session);
    set({
      user: session.user,
      organization: session.organization,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  },

  logout: async () => {
    const { refreshToken } = get();
    // Снимаем устройство с push до инвалидации токена (ТЗ §12).
    await unregisterPush();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // logout не должен падать из-за сети.
    }
    disconnectSocket();
    await clearRefreshToken();
    kv.clearVolatile();
    set({
      status: 'unauthenticated',
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      orgRole: null,
    });
  },

  setUser: (user) => {
    kv.setJSON(K_USER, user);
    set({ user });
  },
}));

/**
 * Внедрение обработчиков токенов в axios-клиент. Вызывается один раз при
 * загрузке модуля — refresh и onAuthFailure всегда читают актуальный стор.
 */
configureApiAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshTokens: async () => {
    const rt =
      useAuthStore.getState().refreshToken ?? (await getRefreshToken());
    if (!rt) return null;
    try {
      const session = await authApi.refresh(rt);
      await persistSession(session);
      useAuthStore.setState({
        user: session.user,
        organization: session.organization,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        status: 'authenticated',
      });
      return session.accessToken;
    } catch {
      return null;
    }
  },
  onAuthFailure: () => {
    void useAuthStore.getState().logout();
  },
});
