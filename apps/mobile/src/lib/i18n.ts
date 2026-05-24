/**
 * Локализация (ТЗ §14): i18next + react-i18next.
 * Языки: ru (дефолт), en, th. Определение через expo-localization,
 * выбор пользователя сохраняется в MMKV.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
import th from '@/i18n/locales/th.json';
import { kv } from '@/lib/storage';

export const SUPPORTED_LOCALES = ['ru', 'en', 'th'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'ru';

const LOCALE_KEY = 'app.locale';

function resolveInitialLocale(): SupportedLocale {
  const stored = kv.getString(LOCALE_KEY) as SupportedLocale | undefined;
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;

  const device = getLocales()[0]?.languageCode;
  if (device && SUPPORTED_LOCALES.includes(device as SupportedLocale)) {
    return device as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    th: { translation: th },
  },
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Сменить язык и запомнить выбор. */
export function setLocale(locale: SupportedLocale): void {
  kv.setString(LOCALE_KEY, locale);
  void i18n.changeLanguage(locale);
}

export function getLocale(): SupportedLocale {
  return (i18n.language as SupportedLocale) ?? DEFAULT_LOCALE;
}

export default i18n;
