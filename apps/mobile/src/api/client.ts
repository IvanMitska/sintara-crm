/**
 * Axios-клиент. Паттерн интерсептора зеркалит apps/frontend/src/lib/api.ts:
 *  - request: Authorization: Bearer <accessToken>
 *  - response 401: один POST /auth/refresh → ретрай; повторный 401 → logout.
 *
 * Чтобы избежать циклических импортов с auth-стором, обработчики токенов
 * внедряются через configureApiAuth() из корневого layout.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios';

import { API_BASE_URL } from '@/lib/env';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/** Голый axios без интерсепторов — для /auth/refresh, чтобы не было рекурсии. */
export const rawApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

interface AuthHandlers {
  /** Текущий accessToken (память). */
  getAccessToken: () => string | null;
  /** Обновить токены. Возвращает новый accessToken или null при провале. */
  refreshTokens: () => Promise<string | null>;
  /** Невозможно обновить — нужно разлогинить. */
  onAuthFailure: () => void;
}

let handlers: AuthHandlers | null = null;

export function configureApiAuth(h: AuthHandlers): void {
  handlers = h;
}

// Гард: параллельные 401 не должны порождать несколько refresh-запросов.
let refreshPromise: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (!handlers) return Promise.resolve(null);
  if (!refreshPromise) {
    refreshPromise = handlers
      .refreshTokens()
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = handlers?.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      handlers
    ) {
      originalRequest._retry = true;
      const newToken = await refreshOnce();
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      handlers.onAuthFailure();
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Унифицированная ошибка API для UI/тостов. */
export interface ApiError {
  status: number;
  message: string;
  raw: unknown;
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : (data?.message ??
        (status === 0 ? 'Нет соединения с сервером' : 'Произошла ошибка'));
    return { status, message, raw: error };
  }
  return { status: 0, message: 'Неизвестная ошибка', raw: error };
}
