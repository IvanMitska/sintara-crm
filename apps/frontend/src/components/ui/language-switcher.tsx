"use client";

import { useTranslation } from "@/components/providers/language-provider";
import { LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Compact RU/EN toggle. Persists to localStorage via the provider, so it works
 * before authentication (e.g. on the login screen) without hitting the backend.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md",
        className,
      )}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          type="button"
          onClick={() => setLanguage(lang.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors",
            language === lang.value
              ? "bg-white/10 text-white ring-1 ring-inset ring-white/15 shadow-sm"
              : "text-gray-400 hover:text-white hover:bg-white/[0.06]",
          )}
        >
          {lang.value}
        </button>
      ))}
    </div>
  );
}
