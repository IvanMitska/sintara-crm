/**
 * Форматирование (ТЗ §14): валюта через Intl, даты через date-fns
 * с относительными вариантами и локалью.
 */
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { enUS, ru, th } from 'date-fns/locale';

import type { Currency } from '@/types';

const dateLocales = { ru, en: enUS, th } as const;
export type AppLocale = keyof typeof dateLocales;

/** Денежная сумма по валюте организации. */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: AppLocale = 'ru',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

/** Целое число с разделителями разрядов. */
export function formatNumber(value: number, locale: AppLocale = 'ru'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Дата вида «15 мая, 14:30». */
export function formatDateTime(date: string | Date, locale: AppLocale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM, HH:mm', { locale: dateLocales[locale] });
}

/** Короткая дата вида «15 мая». */
export function formatDate(date: string | Date, locale: AppLocale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM', { locale: dateLocales[locale] });
}

/** Относительное время: «5 мин назад» / «вчера, 14:30» / «15 мая». */
export function formatRelative(date: string | Date, locale: AppLocale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const loc = dateLocales[locale];
  if (isToday(d)) {
    return formatDistanceToNow(d, { locale: loc, addSuffix: true });
  }
  if (isYesterday(d)) {
    return `${format(d, "'вчера', HH:mm", { locale: loc })}`;
  }
  return format(d, 'd MMM', { locale: loc });
}

/** Инициалы для аватара-плейсхолдера. */
export function initials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim()?.[0] ?? '';
  const l = lastName?.trim()?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}
