import { ru, type Dictionary } from "./ru";
import { en } from "./en";

export type Language = "ru" | "en";

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: "ru", label: "Русский", nativeLabel: "Русский" },
  { value: "en", label: "English", nativeLabel: "English" },
];

export const dictionaries: Record<Language, Dictionary> = { ru, en };

export const DEFAULT_LANGUAGE: Language = "ru";

export const isLanguage = (val: unknown): val is Language =>
  val === "ru" || val === "en";

export type { Dictionary };
