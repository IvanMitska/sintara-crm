"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthStore } from "@/store/auth";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  isLanguage,
  type Dictionary,
  type Language,
} from "@/lib/i18n";

const STORAGE_KEY = "app-language";

type TranslateVars = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: TranslateVars) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveKey(dict: Dictionary, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict,
    );
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const userLanguage = useAuthStore((state) => state.user?.language);

  // Hydrate from localStorage on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) {
      setLanguageState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  // When the authenticated user has a saved language and the device has no
  // explicit local override yet, adopt the user's preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored && isLanguage(userLanguage)) {
      setLanguageState(userLanguage);
      document.documentElement.lang = userLanguage;
    }
  }, [userLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => {
      let value = resolveKey(dictionaries[language], key);
      if (typeof value !== "string") {
        value = resolveKey(dictionaries[DEFAULT_LANGUAGE], key);
      }
      if (typeof value !== "string") return key;
      return interpolate(value, vars);
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
