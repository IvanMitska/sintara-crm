/** UI-стор: глобальное состояние интерфейса (не серверные данные). */
import { create } from 'zustand';

import type { SupportedLocale } from '@/lib/i18n';
import { getLocale, setLocale } from '@/lib/i18n';
import { kv } from '@/lib/storage';

interface UiState {
  locale: SupportedLocale;
  biometricEnabled: boolean;
  /** Маркер отсутствия сети — показывается в шапке (ТЗ §11.1). */
  offline: boolean;

  changeLocale: (locale: SupportedLocale) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setOffline: (offline: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  locale: getLocale(),
  biometricEnabled: kv.getBool('app.biometricEnabled'),
  offline: false,

  changeLocale: (locale) => {
    setLocale(locale);
    set({ locale });
  },
  setBiometricEnabled: (enabled) => {
    kv.setBool('app.biometricEnabled', enabled);
    set({ biometricEnabled: enabled });
  },
  setOffline: (offline) => set({ offline }),
}));
