/**
 * Persistence через react-native-mmkv (шифрованное KV, ~30x быстрее AsyncStorage).
 * Токены здесь НЕ хранятся в открытом виде — refresh уходит в expo-secure-store
 * (см. secure.ts), accessToken дублируется в зашифрованный MMKV.
 */
import { MMKV } from 'react-native-mmkv';

/** Основное хранилище приложения (зашифровано). */
export const storage = new MMKV({
  id: 'sintara-crm',
  encryptionKey: 'sintara-crm-mmkv-v1',
});

/** Отдельный инстанс под кэш TanStack Query (можно чистить независимо). */
export const queryStorage = new MMKV({
  id: 'sintara-crm-query-cache',
  encryptionKey: 'sintara-crm-mmkv-v1',
});

/** Ключи, переживающие logout (preferences). */
export const PERSISTENT_KEYS = ['app.locale', 'app.biometricEnabled'] as const;

/** Типобезопасный JSON-доступ. */
export const kv = {
  getString(key: string): string | undefined {
    return storage.getString(key);
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getJSON<T>(key: string): T | undefined {
    const raw = storage.getString(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  setJSON<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  getBool(key: string): boolean {
    return storage.getBoolean(key) ?? false;
  },
  setBool(key: string, value: boolean): void {
    storage.set(key, value);
  },
  delete(key: string): void {
    storage.delete(key);
  },
  /** Очистка при logout: всё, кроме PERSISTENT_KEYS. */
  clearVolatile(): void {
    const keep = new Map<string, string | undefined>();
    for (const k of PERSISTENT_KEYS) keep.set(k, storage.getString(k));
    storage.clearAll();
    for (const [k, v] of keep) if (v !== undefined) storage.set(k, v);
    queryStorage.clearAll();
  },
};

/** Persister-совместимый интерфейс синхронного storage для TanStack Query. */
export const querySyncStorage = {
  getItem: (key: string) => queryStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => queryStorage.set(key, value),
  removeItem: (key: string) => queryStorage.delete(key),
};
