/** Доступ к рантайм-конфигу из app.config.ts (extra). */
import Constants from 'expo-constants';

interface Extra {
  apiUrl: string;
  appEnv: 'development' | 'preview' | 'production';
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

export const env = {
  apiUrl: extra.apiUrl ?? 'http://localhost:3001',
  appEnv: extra.appEnv ?? 'development',
  isDev: (extra.appEnv ?? 'development') === 'development',
} as const;

/** Полный базовый URL REST API. */
export const API_BASE_URL = `${env.apiUrl}/api`;
