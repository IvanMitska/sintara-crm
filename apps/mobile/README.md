# Sintara CRM — Mobile (`@sintara-crm/mobile`)

Нативное приложение CRM (iOS + Android) на React Native + Expo. Реализуется
по `MOBILE_APP_TZ.md` (корень монорепо).

## Статус

Стек: Expo SDK 52 (RN 0.76, New Architecture), expo-router v4, TypeScript
strict, TanStack Query, zustand, Socket.IO, NativeWind. ~170 экранов/модулей.

- **Фаза 1 — Foundation** ✅ — каркас, дизайн-система, auth-flow, навигация.
- **Фаза 2 — Чтение** ✅ — все модули CRM на чтение: Сегодня, Сделки
  (список/Kanban/карточка), Лиды, Контакты, Компании, Задачи, Каталог,
  Команда, Активности, Booking, Автоматизации, Инбокс, Уведомления,
  Аналитика, поиск + real-time синхронизация.
- **Фаза 3 — Мутации** ✅ — создание/редактирование всех сущностей,
  действия сделок/лидов/задач, отправка сообщений, optimistic updates,
  offline-outbox, merge дубликатов.
- **Фаза 4 — Power features** ✅ (частично) — push-клиент, настройки,
  интеграции, импорт/экспорт контактов, сканер визиток.
- **Фаза 5 — Polish & Release** 🚧 — E2E Maestro, reduced-motion a11y,
  release-доки (`RELEASE.md`).

**Остаётся:** полная локализация (вынос hard-coded строк — много русского
текста в экранах Фаз 2–4), реальные иконки/сплеш, OCR визиток (MLKit),
дельта-синхронизация, отдельное управление каналами (Telegram/WhatsApp/
Email-аккаунты), submission в сторы. См. `RELEASE.md`.

## Запуск

Из **корня монорепо**:

```bash
pnpm install
pnpm --filter @sintara-crm/mobile start   # либо: pnpm mobile:dev
```

Затем `i` (iOS) / `a` (Android). Нужен dev-client (`expo-dev-client`) —
сборка через EAS или `expo run:ios` / `expo run:android`.

> **pnpm-монорепо:** `metro.config.js` настроен на `watchFolders` корня и
> `nodeModulesPaths`. Если Metro не находит модули — добавьте в корневой
> `.npmrc` строку `node-linker=hoisted` и переустановите зависимости.

## Окружения

`APP_ENV` (`development` | `preview` | `production`) выбирает `API_URL`
в `app.config.ts`. Локально создайте `.env` из `.env.example`.
Android-эмулятор: `API_URL=http://10.0.2.2:3001`.

## Скрипты

| Команда | Действие |
|---|---|
| `pnpm start` | Metro + dev-client |
| `pnpm ios` / `pnpm android` | нативная сборка и запуск |
| `pnpm lint` | ESLint |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm test` | Jest |

## Структура

```
app/            экраны (expo-router): (auth) (tabs) modal
.maestro/       E2E-сценарии (Maestro)
src/
  api/          axios-клиент + эндпоинты (1:1 с backend-контроллерами)
  components/   ui · glass · layout · auth · form · <домены>
  hooks/        queries, mutations, real-time, push, useCan …
  lib/          socket, storage, secure, query, i18n, push,
                offline-queue, import-export, permissions, format
  store/        zustand (auth, ui)
  theme/        дизайн-токены
  types/        доменные типы (сверены с prisma/schema.prisma)
  i18n/locales  ru · en · th
```

## Сборка и релиз

См. `RELEASE.md` (EAS build/submit, чеклист сторов) и `.maestro/README.md`
(E2E).

## Зависимости от backend (ТЗ §23)

Не реализованы на backend — клиент к ним обращается и устойчив к 404:
`POST/DELETE /notifications/devices`, `PATCH /users/me/notification-prefs`,
`POST /auth/forgot-password`, фильтр `?updatedSince=`, push-сервис (Expo
Push API). Без них push end-to-end и серверный синк настроек не работают.
