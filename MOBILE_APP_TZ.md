# ТЗ: Мобильное приложение Sintara CRM (iOS + Android)

> Версия: 2.0
> Дата: 2026-05-15
> Статус: к реализации
> Объём v1: **паритет с web-CRM минус admin-конструкторы** (конструктор автоматизаций и управление webhooks остаются в web; всё остальное — на мобильном).
> Цель: native-feel мобильное приложение поверх существующего backend (`apps/backend`, NestJS + Prisma + Postgres + Socket.IO), наследующее визуальный язык web-продукта (cosmic dark + glassmorphism). Уровень полировки и полноты — как у Bitrix24 Mobile / amoCRM, но в нашем дизайне.

Документ написан так, чтобы агент реализовал приложение **без догадок**. Все эндпоинты в этом ТЗ — **реальные**, сверены с контроллерами `apps/backend/src/modules/*`. Если ответа в документе нет — задавайте вопрос, **не выдумывайте API**.

---

## 0. TL;DR

- **Что строим:** нативное приложение на React Native + Expo (SDK 51+, Hermes, New Architecture). Без WebView.
- **Объём:** все рабочие модули CRM на мобильном — сделки, лиды, воронки, омниканальный инбокс, контакты, компании, задачи (включая повторяющиеся), каталог товаров, команда, автоматизации (просмотр + вкл/выкл + ручной запуск), онлайн-запись (booking), аналитика, активности, теги, приглашения, мультиорганизация. **Не на мобильном:** визуальный конструктор автоматизаций (создание/редактирование сценариев) и управление webhooks — остаются в web.
- **Backend:** `<API_URL>/api` (REST + Swagger) + Socket.IO (namespace `/`). Схему БД не меняем. Список доработок backend — §23.
- **Real-time:** Socket.IO + комнаты `user:<id>`, `role:<role>`, `team:<teamId>` + подписки `subscribe`/`unsubscribe`; TanStack Query + optimistic updates + инвалидация по событиям.
- **Дизайн:** наследуем `apps/frontend/src/app/globals.css` (cosmic dark `#0a0a12`, primary `#8B5CF6→#6366F1`, accent `#14B8A6→#06B6D4`, glass через `expo-blur`).
- **Платформы:** iOS 15+, Android 8.0+ (API 26+). Только тёмная тема в v1. 60fps минимум.
- **Релиз:** EAS Build + Submit, TestFlight + Google Play. Bundle id `com.sintara.crm.mobile`.
- **Срок:** ~11–12 недель до v1.0.0 (5 фаз, §21).

---

## 1. Цели и метрики

### 1.1 Бизнес-цели
1. **Удержать менеджера в системе вне офиса** — 40%+ DAU открывают приложение ≥ 1 раз в день вне web-сессий.
2. **Ноль забытых лидов** — push о новом лиде/сообщении доходит < 5 сек после события.
3. **Сделки мобайл-only** — 25% сделок двигаются по воронке хотя бы раз через мобильный.
4. **Рейтинг в сторах** — App Store ≥ 4.6, Google Play ≥ 4.4 через 3 месяца.
5. **Полнота** — менеджеру не нужно открывать веб для повседневной работы (только конструктор автоматизаций и webhooks).

### 1.2 Продуктовые принципы
1. **Mobile-first, не уменьшенный web.** Важные действия — в нижней трети экрана, под большой палец.
2. **Real-time не обсуждается.** Любое изменение появляется у других пользователей за ≤ 2 сек без ручного refresh.
3. **Offline-tolerant.** Чтение кэша работает офлайн. Запись — в очередь, синк при сети.
4. **60 fps минимум.** Списки/переходы/анимации — через Reanimated на UI-треде. Dropped frame = баг.
5. **Тишина важнее шума.** Push группируются и rate-limit'ятся.

### 1.3 Non-goals v1
- Визуальный конструктор автоматизаций (создание/редактирование триггеров-условий-действий) — остаётся в web. Мобильный: список, просмотр, вкл/выкл, ручной запуск, лог запусков.
- Управление webhooks (`webhooks` модуль) — полностью web-only.
- Биллинг и тарифы — только просмотр текущего тарифа, оплата — в web.
- Удаление организации — только в web.
- Light theme — v2.
- iPad split-view — v2 (в v1 — scaled mobile).

---

## 2. Аудитория и сценарии

### 2.1 Персоны
| Персона | Доля | Главное в мобильном |
|---|---|---|
| **Менеджер/оператор** (`MANAGER`/`OPERATOR`) | 70% | Двигает сделки, отвечает в инбоксе, ставит задачи, звонит, заводит лиды на встречах |
| **Супервайзер** (`SUPERVISOR`) | 15% | Контроль загрузки команды, дашборд, перераспределение лидов и сделок |
| **Админ/Owner** (`ADMIN`/`OWNER`) | 15% | Дашборд, аналитика, команда, приглашения, критичные ответы |

### 2.2 Top-15 сценариев (JTBD)
1. Пришёл лид с сайта → push → экран лида → «взять в работу» → написать клиенту.
2. Еду к клиенту → открыть сделку → таймлайн активностей + сообщения + заметки.
3. Двинуть сделку на этап → drag в Kanban или «Сменить этап».
4. Ответить клиенту в WhatsApp/Telegram/Email → инбокс → диалог → ответ.
5. Поставить задачу себе/коллеге → кнопка «+» → задача за 5 сек.
6. Записать клиента на услугу → ресурс → слот → подтверждение.
7. «Что у меня сегодня» → главный экран (задачи + встречи + новые сообщения + бронирования).
8. Найти контакт по имени/телефону → глобальный поиск с любого экрана.
9. Зафиксировать звонок → кнопка «Позвонить» → системный звонок → автозапись активности.
10. Сканировать визитку → камера → OCR → создать контакт.
11. Конвертировать лид в сделку → кнопка «Сконвертировать».
12. Найти и слить дубли контактов → экран дубликатов → merge.
13. Создать повторяющуюся задачу (еженедельный созвон) → recurring task.
14. Супервайзер: посмотреть, кто из команды онлайн и сколько у кого сделок.
15. Админ: пригласить нового сотрудника → ввести email + роль → отправить приглашение.

---

## 3. Полная карта функционала: web → mobile

> Это контрольная таблица паритета. Каждый модуль backend и каждая web-страница имеют явный статус в мобильном.

| Web-страница / backend-модуль | Mobile v1 | Где в приложении |
|---|---|---|
| `dashboard` | ✅ Полностью | Tab «Сегодня» + Дашборд |
| `deals` (сделки) | ✅ Полностью | Tab «Сделки» |
| Воронки/этапы (`pipelines`) | ✅ Просмотр + Kanban; редактирование структуры воронки — ⚠️ web | Tab «Сделки» → Воронка |
| `leads` (лиды) | ✅ Полностью | Tab «Сделки» → сегмент «Лиды» |
| `messages` + `email`/`email-imap` + `telegram` + `whatsapp` (омниканал) | ✅ Полностью (чтение, отправка, привязка) | Tab «Инбокс» |
| `contacts` (контакты, дубли, merge, import) | ✅ Полностью; export — ⚠️ только share-ссылкой | «Ещё» → Контакты |
| `companies` (компании, merge, import) | ✅ Полностью | «Ещё» → Компании |
| `tasks` (задачи, recurring, calendar) | ✅ Полностью | «Ещё» → Задачи (+ в «Сегодня») |
| `activities` (активности) | ✅ Полностью | Внутри карточек + «Ещё» → Активности |
| `products` (каталог) | ✅ Полностью | «Ещё» → Каталог |
| `tags` (теги) | ✅ CRUD тегов + назначение | «Ещё» → Настройки → Теги; инлайн в карточках |
| `employees` + `users` + `organizations/members` (команда) | ✅ Просмотр, онлайн-статус, статистика, смена роли, активация; приглашения | «Ещё» → Команда |
| `invitations` (приглашения) | ✅ Создать/отправить/повторить/отозвать | «Ещё» → Команда → Пригласить |
| `automation` (автоматизации) | ✅ Список, просмотр, вкл/выкл, ручной запуск, лог. ⚠️ Создание/редактирование сценария — web | «Ещё» → Автоматизации |
| `booking` (онлайн-запись, ресурсы, услуги, лист ожидания) | ✅ Полностью | «Ещё» → Запись |
| `analytics` (аналитика) | ✅ Полностью (5 эндпоинтов) | «Ещё» → Аналитика |
| `notifications` (уведомления) | ✅ Полностью + push | Колокольчик в шапке |
| `integrations` + Telegram-боты + WhatsApp-аккаунты + email-аккаунты | ✅ Просмотр статуса, connect/disconnect, привязка нераспознанных чатов, добавление email-аккаунта | «Ещё» → Настройки → Интеграции |
| `organizations` (мультиорг, switch) | ✅ Переключение организаций, просмотр/редактирование текущей | Drawer профиля |
| `settings` (настройки) | ✅ Профиль, нотификации, безопасность, язык, организация | «Ещё» → Настройки |
| `webhooks` | ❌ web-only | — |
| Конструктор автоматизаций (drag-and-drop сценариев) | ❌ web-only | — |
| Биллинг/оплата тарифа | ⚠️ просмотр тарифа, оплата — web | «Ещё» → Настройки → Тариф |
| Удаление организации | ❌ web-only | — |

---

## 4. Технический стек

### 4.1 Почему React Native + Expo (а не натив / Flutter)
- У вас TS-монорепо (Next.js web + NestJS backend). RN даёт переиспользование типов, zod-схем, query-логики, знаний команды. Flutter (Dart) и натив (Swift+Kotlin) этого не дают — +2x времени и стоимости.
- На RN построены HubSpot, Shopify, Discord, Coinbase, Bloomberg. New Architecture (Fabric + TurboModules) + Hermes закрывают разрыв в производительности с нативом для CRM-задач (списки, формы, чаты).
- Полный натив даёт максимальную полировку под платформу, но требует двух команд. Рекомендуется только если нативные разработчики уже в штате. Для данного проекта — **RN + Expo оптимально**.

### 4.2 Core
| Слой | Технология | Версия | Зачем |
|---|---|---|---|
| Runtime | **React Native** | 0.76+ | New Architecture (Fabric + TurboModules) |
| SDK / тулинг | **Expo** | SDK 51+ | EAS, OTA, expo-router, прокатанные модули |
| Язык | **TypeScript** | 5.5+ | `strict: true`, без `any` |
| JS-движок | **Hermes** | включён | startup time, memory |

### 4.3 Навигация
- **expo-router v3** (file-based, как Next.js App Router в web — снижает switch для команды).
- Bottom tabs + native stack внутри каждой вкладки. Модалки — нативные sheet'ы.

### 4.4 Стейт и данные
| Назначение | Библиотека | Заметки |
|---|---|---|
| Серверный кэш | **@tanstack/react-query v5** | Тот же, что web — переносим queryKeys |
| UI-стейт | **zustand v4** | Тот же, что web |
| Формы | **react-hook-form + zod** | Тот же стек, что web |
| Сеть | **axios** | Паттерн интерсептора из `apps/frontend/src/lib/api.ts` |
| WebSocket | **socket.io-client v4** | Авторизация через `auth: { token }` в handshake |
| Persistence | **react-native-mmkv** | Шифрованное KV, ~30x быстрее AsyncStorage |
| Secure storage | **expo-secure-store** | Только токены (Keychain/Keystore) |

### 4.5 UI и анимации
| Слой | Библиотека | Примечание |
|---|---|---|
| Стили | **NativeWind v4** | Паритет токенов с web. **Альтернатива для упора на 120fps — Unistyles 3** (C++ ядро). Решение фиксируется до Фазы 1. |
| Иконки | **lucide-react-native** | Тот же набор, что web |
| Анимации | **react-native-reanimated v3** + **react-native-gesture-handler** | UI-тред |
| Списки | **@shopify/flash-list** | Вместо FlatList — критично для длинных списков |
| Bottom sheet | **@gorhom/bottom-sheet v5** | |
| Тосты | **burnt** | Нативные |
| Skeleton | **moti** | Поверх Reanimated |
| Blur (glass) | **expo-blur** | `BlurView tint="dark"` |
| Image | **expo-image** | Кэш, lazy, blurhash |
| Charts | **victory-native** (Skia) | Дашборд/аналитика |
| Календарь | **react-native-calendars** или Skia-grid | Booking, calendar задач |

### 4.6 Платформенные капабилити
| Что | Модуль |
|---|---|
| Push | **expo-notifications** (APNs + FCM) |
| Камера / QR / визитки | **react-native-vision-camera v4** + MLKit OCR (или `expo-camera` + `expo-image-picker`) |
| Контакты телефона | **expo-contacts** |
| Звонки | **expo-linking** (`tel:`) |
| Биометрия | **expo-local-authentication** |
| Haptics | **expo-haptics** |
| Календарь устройства | **expo-calendar** |
| Геолокация | **expo-location** |
| Файлы / share | **expo-document-picker** + **expo-sharing** |
| Аудио (голосовые) | **expo-av** |
| Локализация | **expo-localization** + **i18next** + **react-i18next** |
| Сеть | **@react-native-community/netinfo** |
| Deep links | **expo-linking** (схема `sintara://`) |
| Защита экрана | **expo-screen-capture** |

### 4.7 Качество и observability
| Назначение | Инструмент |
|---|---|
| Unit | **jest** + **@testing-library/react-native** |
| E2E | **maestro** (yaml flows) |
| Mock API в тестах | **MSW** |
| Lint / Format | **eslint** + **prettier** (общий конфиг из корня) |
| Type-check | `tsc --noEmit` в CI |
| Crash reporting | **Sentry** (`@sentry/react-native`) |
| Product analytics | **PostHog** (`posthog-react-native`) |

---

## 5. Структура репозитория

Новый workspace `apps/mobile` (`@sintara-crm/mobile`):

```
apps/mobile/
  app/                              # expo-router
    (auth)/
      sign-in.tsx  sign-up.tsx  forgot-password.tsx  two-factor.tsx  accept-invite.tsx
    (tabs)/
      _layout.tsx                   # bottom tab bar
      index.tsx                     # Сегодня
      deals/
        _layout.tsx                 # stack
        index.tsx                   # Сделки / Лиды / Воронка (сегменты)
        [id].tsx                    # карточка сделки
        new.tsx
        lead/[id].tsx               # карточка лида
      inbox/
        index.tsx                   # омниканальный список диалогов
        [contactId].tsx             # диалог (по contactId — см. §8.5)
      more/
        index.tsx                   # хаб «Ещё» (сетка разделов)
        contacts/  companies/  tasks/  products/  team/  automations/
        booking/  analytics/  activities/  settings/
    modal/
      global-search.tsx  quick-add.tsx  scanner.tsx  filters.tsx
    _layout.tsx                     # root providers
    +not-found.tsx
  src/
    api/                            # axios + endpoints (1:1 с реальными контроллерами)
    components/
      ui/        # Button Card Input Sheet Avatar Badge Segmented Skeleton ...
      glass/     # GlassCard CosmicBg
      deals/ leads/ inbox/ contacts/ companies/ tasks/ products/
      team/ automations/ booking/ analytics/ notifications/
    hooks/
    lib/
      socket.ts  push.ts  storage.ts  secure.ts  i18n.ts
      permissions.ts  offline-queue.ts  format.ts
    store/                          # zustand
    types/                          # доменные типы (из @prisma/client вывода)
    theme/  tokens.ts  index.ts
  assets/  icons/ fonts/ splash/
  app.config.ts  eas.json  tailwind.config.js  babel.config.js  metro.config.js
  package.json  tsconfig.json
```

Опционально `packages/shared` — общие типы/zod/enums между web, mobile, backend. Если замедляет старт — копируем типы в `apps/mobile/src/types/`.

Корневой `package.json` — добавить:
```json
"mobile:dev": "pnpm --filter @sintara-crm/mobile start",
"mobile:ios": "pnpm --filter @sintara-crm/mobile ios",
"mobile:android": "pnpm --filter @sintara-crm/mobile android"
```

Тулчейн: Node ≥ 20, pnpm 8.15+, Xcode 15.4+, Android SDK 34 / NDK r26.

---

## 6. Дизайн-система

### 6.1 Источник истины
Токены наследуются из `apps/frontend/src/app/globals.css` + `apps/frontend/tailwind.config.ts`. Любое расхождение — баг.

### 6.2 Палитра (`src/theme/tokens.ts`)
```ts
export const colors = {
  bg: {
    base:      '#0a0a12',
    raised:    '#0d0d18',
    card:      'rgba(18,18,28,0.7)',
    cardLight: 'rgba(22,22,42,0.6)',
    sidebar:   'rgba(12,12,20,0.85)',
    strong:    'rgba(15,15,25,0.9)',
    modalBackdrop: 'rgba(0,0,0,0.75)',
  },
  text: {
    primary:   '#f5f5f7',
    secondary: 'rgba(245,245,247,0.72)',
    muted:     'rgba(245,245,247,0.55)',
    disabled:  'rgba(245,245,247,0.35)',
  },
  brand: {
    primary500: '#8B5CF6', primary600: '#6366F1',
    accent500:  '#14B8A6', accent600:  '#06B6D4',
    purple500:  '#A855F7', pink: '#FF6B9D',
  },
  status: { success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6' },
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.08)',
    strong:  'rgba(255,255,255,0.12)',
  },
} as const;

export const gradients = {
  primary: ['#8B5CF6', '#6366F1'] as const,
  accent:  ['#14B8A6', '#06B6D4'] as const,
  purple:  ['#A855F7', '#8B5CF6'] as const,
};
```

### 6.3 Glassmorphism в RN
- **Карточки:** `<BlurView intensity={50} tint="dark">` + заливка `colors.bg.card` + бордер `colors.border.default` + `borderRadius 16` + верхний highlight `borderTopColor 'rgba(255,255,255,0.05)'`.
- **Bottom sheet / модалки:** intensity 80, заливка `colors.bg.strong`.
- **Tab bar:** absolute + `BlurView intensity 70`.
- **Android API 26–30:** blur может деградировать → fallback на непрозрачную `colors.bg.card` без blur (приемлемо).

### 6.4 Семантика статусов (бэйджи)
```
DealStatus:    NEW серый · QUALIFICATION синий · PROPOSAL голубой · NEGOTIATION жёлтый
               CONTRACT фиолетовый · PAYMENT бирюзовый · SUCCESS зелёный · LOST красный
DealPriority:  LOW серый · MEDIUM жёлтый · HIGH красный
DealTemperature: HOT 🔥 красный · WARM 🌡 оранжевый · COLD ❄️ синий
TaskStatus:    PENDING серый · IN_PROGRESS синий · COMPLETED зелёный · CANCELLED серый
TaskPriority:  LOW · MEDIUM · HIGH · URGENT (URGENT — красный пульсирующий)
LeadStatus:    NEW · IN_PROGRESS · QUALIFIED · CONVERTED зелёный · LOST красный
BookingStatus: PENDING · CONFIRMED · IN_PROGRESS · COMPLETED · CANCELLED · NO_SHOW
```

### 6.5 Типографика
- Шрифт **Inter** (variable) через `@expo-google-fonts/inter`. Числа дашборда — Geist Mono (опц.).
- Шкала (line-height = size×1.4 кроме display):
  ```
  display 32/1.15 · title 24/1.25 · headline 20/1.3 · body 16/1.45
  callout 15/1.4 · subhead 13/1.4 · caption 11/1.35
  ```
- Веса: 400/500/600/700. Headlines — 600/700.

### 6.6 Радиусы, отступы, motion
- Радиусы: `xs6 sm8 md12 lg16 xl20 2xl24 pill9999`. Карточки списков — `lg`, модалки — `2xl` сверху.
- Грид: база 4px, gap 8/12/16, между секциями 24/32.
- Safe area: всегда `useSafeAreaInsets()`.
- Motion: база 200ms `Easing.bezier(0.16,1,0.3,1)`; экраны — `slide_from_right`; sheet — spring `damping18 stiffness220`.
- Haptics: `selectionAsync()` на тапах, `notificationAsync(Success)` на создании сущностей.
- Skeleton: shimmer 1.2s, opacity 0.3→0.7.

### 6.7 Брендинг
- Splash: `bg.base` + лого + статичная cosmic-gradient подложка.
- iOS icon `1024×1024` без альфы. Android adaptive: foreground `512×512` прозрачный + background `brand.primary500`.

---

## 7. Навигация и информационная архитектура

### 7.1 Bottom Tab Bar (5 пунктов)
```
[ Сегодня ]   [ Сделки ]   [ ＋ ]   [ Инбокс ]   [ Ещё ]
```
- **Центр `+`** — Quick Add (модалка): новый лид / контакт / компания / задача / сделка / запись / скан визитки.
- **Бэйджи:** Инбокс — непрочитанные диалоги; Сегодня — просроченные задачи (красным).

### 7.2 «Ещё» — хаб (сетка иконок)
Контакты · Компании · Задачи · Каталог · Команда · Запись · Автоматизации · Аналитика · Активности · Настройки. Для `OPERATOR` скрыты: Аналитика, Команда-управление (см. RBAC §13).

### 7.3 Top-bar
- Слева: аватар → drawer профиля (организация, переключение организаций, выход).
- Центр: название экрана.
- Справа: поиск (модалка) + колокольчик уведомлений (badge).

### 7.4 Глобальный поиск (модалка)
Открывается иконкой или swipe-down. Debounce 200ms. Группы: Контакты / Компании / Сделки / Лиды / Задачи / Товары. Параллельные запросы (`Promise.all`) к `?search=&limit=5` каждого ресурса. Последние 5 запросов — в MMKV.

### 7.5 Deep links
Схема `sintara://` + universal/app links `https://app.sintara.crm/m/...`:
- `sintara://deals/<id>` · `sintara://leads/<id>` · `sintara://contacts/<id>` · `sintara://companies/<id>`
- `sintara://inbox/<contactId>` · `sintara://tasks/<id>` · `sintara://bookings/<id>` · `sintara://notifications`
Каждый push несёт `data.url`.

---

## 8. Экраны — детально

> Формат каждого экрана: назначение, состояния (loading/empty/error), real-time источники, действия, **реальные эндпоинты**, RBAC.
> Соглашение: списочные эндпоинты `GET /api/<resource>` поддерживают пагинацию и фильтры; детальные — `GET /api/<resource>/:id`; создание — `POST /api/<resource>`.

### 8.1 Auth flow

#### sign-in (`(auth)/sign-in.tsx`)
- Поля email + password. Кнопки «Войти», «Забыли пароль?», «Создать аккаунт».
- Биометрия: если в SecureStore есть refresh с `biometricBound=true` — при старте FaceID/TouchID для автологина.
- Эндпоинт: `POST /api/auth/login` body `{ email, password, twoFactorCode? }`.
- При `requires2FA` → `(auth)/two-factor.tsx`.
- При успехе: `accessToken` → memory+MMKV, `refreshToken` → SecureStore; `GET /api/auth/me`; init Socket.IO; регистрация push-токена (§10).

#### sign-up (`(auth)/sign-up.tsx`)
- Поля: firstName, lastName, email, password, organizationName, currency (THB/RUB/USD/EUR).
- Эндпоинт: `POST /api/auth/register`.

#### two-factor (`(auth)/two-factor.tsx`)
- 6-значный код, paste-friendly. Повторный `POST /api/auth/login` с `twoFactorCode`.

#### forgot-password
- email → `POST /api/auth/forgot-password` (⚠️ добавить на backend, §23).

#### accept-invite (`(auth)/accept-invite.tsx`)
- Открывается по deep link из письма-приглашения.
- `GET /api/invitations/token/:token` — данные приглашения (организация, роль).
- Форма регистрации → `POST /api/invitations/accept`.

### 8.2 Сегодня (`(tabs)/index.tsx`)
Главный экран. Скроллируемый список с pull-to-refresh.

**Секции:**
1. Greeting «Привет, <имя>» + дата.
2. **Quick Stats** (4 карточки, горизонтальный скролл): сделок в работе / задач сегодня / новых лидов / непрочитанных сообщений — `GET /api/analytics/dashboard`.
3. **Задачи на сегодня** — `GET /api/analytics/today-tasks`. Свайп влево — выполнить (`POST /api/tasks/:id/complete`), вправо — перенести на завтра (`PATCH /api/tasks/:id`).
4. **Просроченные задачи** — красный бэйдж.
5. **Свежие лиды** (5 шт) — `GET /api/leads?limit=5&sort=createdAt:desc`.
6. **Сводка по воронке** — мини-Kanban (кол-во сделок по этапам), тап → Сделки с фильтром.
7. **Сегодняшние записи** (если booking активен) — `GET /api/booking/schedule?date=today`.
8. **Активность команды** (для SUPERVISOR/ADMIN) — `GET /api/activities?limit=10`.

**Real-time:** `notification:new`, `deal:created|updated|moved`, `lead:created`, `task:assigned`, `message:new` → инвалидация `['analytics','dashboard']` и точечные тосты.
**States:** loading — skeleton по форме; empty — «Сегодня ничего срочного 🎉»; error — retry.

### 8.3 Сделки (`(tabs)/deals/`)

Сегменты сверху: **Сделки · Лиды · Воронка**.

#### Список сделок (`deals/index.tsx`)
- FlashList карточек: название, сумма+валюта, бэйдж этапа, приоритет, температура, ответственный (Avatar), теги.
- Фильтры (sheet): pipeline, status (`DealStatus`), priority, temperature, ответственный, период. Сохраняются в zustand+MMKV.
- Сортировка: updated / created / amount desc.
- Эндпоинты: `GET /api/deals?pipelineId=&status=&priority=&temperature=&assigneeId=&page=&limit=`; `GET /api/pipelines` (список воронок); `GET /api/deals/pipeline/:pipelineId` (сделки воронки для Kanban).

#### Воронка / Kanban (`deals/index.tsx` сегмент)
- Горизонтальный скролл по этапам (`Stage[]`), внутри — вертикальный список сделок.
- Drag&drop: long-press → плавающая карточка → дроп в колонку → `PATCH /api/deals/:id/move` body `{ stageId }`. Optimistic + откат при ошибке.
- Альтернатива drag — в карточке «Сменить этап» (модалка-select).
- Real-time: подписка `subscribe { channel: 'pipeline', entityId: pipelineId }` → `deal:moved`.

#### Карточка сделки (`deals/[id].tsx`)
- Шапка: название, сумма+валюта (`org.currency`), бэйдж этапа, приоритет, температура, ответственный, теги.
- Sticky bottom bar: «Сменить этап» · «Позвонить» · «Написать» · «+Задача» · «Победа»/«Проигрыш».
- Табы: **Обзор** (контакт, компания, продукты `DealProduct`, сумма, дата закрытия, источник) · **Активности** (`GET /api/activities?dealId=`) · **Сообщения** · **Задачи** (`GET /api/tasks?dealId=`) · **Заметки** (`Activity` тип `NOTE`).
- Действия: `GET /api/deals/:id`, `GET /api/deals/:id/stats`, `PATCH /api/deals/:id`, `DELETE /api/deals/:id`, `PATCH /api/deals/:id/move`, `POST /api/deals/:id/won`, `POST /api/deals/:id/lost`, `POST /api/deals/:id/duplicate`.
- Real-time: `subscribe { channel:'deal', entityId:id }` → `activity:created`, `message:new`, `task:created`.

#### Новая сделка (`deals/new.tsx`)
3 шага: Основное (название, сумма, валюта, приоритет, температура) → Связи (контакт autocomplete `GET /api/contacts?search=`, компания, воронка+этап) → Доп. (теги, ответственный, дата закрытия, продукты). Submit → `POST /api/deals`.

#### Лиды (сегмент «Лиды»)
- Карточка: ФИО, источник (`LeadSource`), телефон, `LeadStatus`, время.
- Действия: «Взять в работу» (`PATCH /api/leads/:id` → status IN_PROGRESS + assignee), «Квалифицировать», «Сконвертировать» (`POST /api/leads/:id/convert` → создаёт Deal+Contact), «Закрыть как Lost».
- Эндпоинты: `GET /api/leads`, `GET /api/leads/stats`, `GET /api/leads/:id`, `PATCH /api/leads/:id`, `POST /api/leads/:id/convert`, `DELETE /api/leads/:id`, `POST /api/leads`.
- Real-time: `lead:created`, `lead:updated`, `lead:assigned`.

### 8.4 Воронки — структура (просмотр)
Внутри сегмента «Воронка» — кнопка «⚙ Настроить воронку» доступна только `ADMIN`/`OWNER` и **открывает web** (deep link на web-настройки) с тостом «Редактирование структуры воронки — в веб-версии». Эндпоинты `POST/PATCH/DELETE /api/pipelines/...stages` в мобильном **не используются** для записи (только чтение). Просмотр: `GET /api/pipelines/:id`.

### 8.5 Инбокс (`(tabs)/inbox/`)

> ВАЖНО: backend агрегирует переписку **по контакту**, а не по «чату». Эндпоинты — `/messages/conversations` и `/messages/conversations/:contactId`. Диалог в приложении = тред с контактом, объединяющий все каналы (Telegram/WhatsApp/Email/internal).

#### Список диалогов (`inbox/index.tsx`)
- Карточка: аватар + имя контакта, иконки каналов, последнее сообщение, время, бэйдж непрочитанных.
- Фильтры: канал, непрочитанные, привязка к сделке.
- Эндпоинты: `GET /api/messages/conversations?channel=&search=&unread=`; `GET /api/messages/stats/channels`; `GET /api/messages/stats/unread` (для бэйджа таб-бара).
- Нераспознанные чаты (контакт ещё не привязан): `GET /api/telegram/chats/unlinked`, `GET /api/whatsapp/chats/unlinked` — отдельная секция «Не привязано» с действием «Привязать к контакту» (`POST /api/telegram/chats/link`, `POST /api/whatsapp/chats/link`).

#### Диалог (`inbox/[contactId].tsx`)
- Chat-UI: inverted FlashList, пагинация вверх, input + attachments + voice (`expo-av`), reply (long-press).
- Эндпоинты: `GET /api/messages/conversations/:contactId?cursor=`; `POST /api/messages/send` body `{ contactId, channel, text, attachments? }`; `PATCH /api/messages/conversations/:contactId/read`; `PATCH /api/messages/:id`, `PATCH /api/messages/:id/read`, `DELETE /api/messages/:id`.
- Email-отправка идёт через `POST /api/email-imap/emails/send` или `/reply` если канал = email.
- Telegram/WhatsApp отправка — через `POST /api/messages/send` (бэкенд роутит в нужный канал) либо напрямую `POST /api/telegram/send` / `POST /api/whatsapp/send` (уточнить у backend; по умолчанию — `/messages/send`).
- Действия: привязать к сделке, создать задачу из сообщения (long-press), пометить (не)прочитанным.
- Real-time: `subscribe { channel:'chat', entityId:contactId }` → `message:new`, `message:read`, `chat:typing`.

### 8.6 Контакты (`(tabs)/more/contacts/`)
- Список: поиск (debounce 250ms) `GET /api/contacts?search=`, sticky-headers по буквам, свайп «Позвонить»/«Написать», FAB «+».
- **Дубликаты:** `…` → «Найти дубли» → `GET /api/contacts/duplicates` → список пар → «Объединить» → `POST /api/contacts/merge`.
- **Импорт из телефона:** `expo-contacts` → выбор → `POST /api/contacts/import`.
- **Импорт файлом:** `expo-document-picker` (CSV/XLSX) → `POST /api/contacts/import`.
- **Экспорт:** `GET /api/contacts/export` → файл → `expo-sharing`.
- **Сканер визиток:** камера + OCR → форма создания → `POST /api/contacts`.
- Карточка (`more/contacts/[id].tsx`): аватар, телефон (тап→звонок), email (тап→mailto), компания, источник, теги. Табы: Сделки / Активности / Сообщения / Задачи / Заметки. Sticky-действия: Позвонить, Написать, +Сделка, +Задача, Сменить владельца (`PATCH /api/contacts/:id/owner`).
- Эндпоинты: `GET /api/contacts/:id`, `GET /api/contacts/:id/stats`, `PATCH /api/contacts/:id`, `DELETE /api/contacts/:id`, `POST /api/contacts`.

### 8.7 Компании (`(tabs)/more/companies/`)
Аналогично контактам: список, поиск, дубли+merge (`POST /api/companies/merge`), импорт (`POST /api/companies/import`), экспорт (`GET /api/companies/export`). Карточка: `GET /api/companies/:id`, `GET /api/companies/:id/stats`, `PATCH`, `PATCH /api/companies/:id/owner`, `DELETE`. Табы: Контакты компании / Сделки / Активности / Задачи.

### 8.8 Задачи (`(tabs)/more/tasks/`)
- Сегменты: Сегодня · Неделя · Все · Просроченные · Завершённые.
- **Вид «Календарь»** — переключатель: `GET /api/tasks/calendar?from=&to=` → задачи по дням.
- Карточка: чекбокс, название, приоритет (`TaskPriority`), due-дата, связь (сделка/контакт), ответственный.
- Действия: тап чекбокса → `POST /api/tasks/:id/complete` (optimistic); long-press → перенести/удалить/сменить приоритет.
- **Повторяющиеся задачи:** при создании — toggle «Повторять» (ежедневно/еженедельно/ежемесячно) → `POST /api/tasks/recurring`.
- Эндпоинты: `GET /api/tasks?status=&assigneeId=&dealId=&contactId=&page=&limit=`, `GET /api/tasks/stats`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, `POST /api/tasks`.
- Real-time: `task:created|updated|completed|assigned`.

### 8.9 Каталог товаров (`(tabs)/more/products/`)
- Список товаров: название, цена, валюта. Поиск.
- Карточка/редактирование: `GET /api/products/:id`, `PATCH /api/products/:id`, `DELETE /api/products/:id`, `POST /api/products` (через хаб или из шага «Продукты» создания сделки).
- Используется в карточке сделки (`DealProduct`): добавить/убрать товар к сделке.

### 8.10 Команда (`(tabs)/more/team/`)
- Список сотрудников: аватар, имя, роль (`UserRole`/`OrgRole`), онлайн-индикатор.
- Онлайн-статус: `GET /api/users/online` + real-time `userOnline`/`userOffline`.
- Карточка сотрудника: `GET /api/users/:id`, `GET /api/users/:id/stats` (сделки, задачи, конверсия).
- Управление (только `ADMIN`/`OWNER`): сменить роль `PATCH /api/users/:id/role` или `PATCH /api/organizations/current/members/:memberId/role`; активировать/деактивировать `PATCH /api/users/:id/toggle-active` / `PATCH /api/organizations/current/members/:memberId/toggle-active`; удалить `DELETE /api/organizations/current/members/:memberId`.
- **Приглашения:** «Пригласить» → email + роль → `POST /api/invitations` (создать). Список приглашений с действиями: повторить `POST /api/invitations/:id/resend`, отозвать `DELETE /api/invitations/:id`.
- Список членов организации: `GET /api/organizations/current/members`.

### 8.11 Автоматизации (`(tabs)/more/automations/`)
- Список: `GET /api/automation` (или `GET /api/automation/active` для активных) — название, описание, триггер, статус.
- Карточка: просмотр триггера, условий, действий (read-only, человекочитаемо), `lastRunAt`.
- Действия: вкл/выкл `PATCH /api/automation/:id` body `{ isActive }`; ручной запуск `POST /api/automation/:id/execute`; удалить `DELETE /api/automation/:id`.
- **Создание/редактирование сценария** — кнопка «Создать в веб-версии» (deep link в web) + тост-объяснение. Конструктор на мобильном не делаем.

### 8.12 Запись / Booking (`(tabs)/more/booking/`)
- Календарь 7/30 дней.
- Ресурсы (`Resource`): `GET /api/booking/resources`, `GET/POST` `/api/booking/resources`, `GET/PATCH/DELETE /api/booking/resources/:id`.
- Услуги (`Service`): `GET/POST /api/booking/services`, `GET/PATCH/DELETE /api/booking/services/:id`.
- Свободные слоты: `GET /api/booking/slots?resourceId=&serviceId=&date=`.
- Расписание: `GET /api/booking/schedule?date=`.
- Статистика: `GET /api/booking/stats`.
- Создать бронь: ресурс → услуга → клиент → слот → `POST /api/booking`.
- Карточка брони: `GET /api/booking/:id`, `PATCH /api/booking/:id`, статусные действия `PATCH /api/booking/:id/confirm|cancel|complete|no-show`, `DELETE /api/booking/:id`.
- **Лист ожидания:** `GET/POST /api/booking/waiting-list`, `PATCH/DELETE /api/booking/waiting-list/:id`.

### 8.13 Аналитика (`(tabs)/more/analytics/`)
Доступ: `MANAGER`/`SUPERVISOR`/`ADMIN`/`OWNER` (не `OPERATOR`).
- KPI-карточки (выручка, кол-во сделок, конверсия, средний чек) — `GET /api/analytics/dashboard`.
- Воронка конверсии — `GET /api/analytics/funnel` (горизонтальные бары).
- Продажи за период — `GET /api/analytics/sales?startDate=&endDate=` (график).
- Активность — `GET /api/analytics/activity?days=` (график).
- Переключатель периода: Сегодня / Неделя / Месяц / Квартал.
> Эндпоинтов `/analytics/managers` и `/analytics/lead-sources` **нет** — не использовать. Статистику по менеджерам берём из `GET /api/users/:id/stats` в разделе Команда.

### 8.14 Активности (`(tabs)/more/activities/`)
Глобальный таймлайн `GET /api/activities` с фильтрами (тип, ответственный, период). Карточка: `GET /api/activities/:id`, `PATCH`, `DELETE`. Создание — `POST /api/activities` (звонок/встреча/заметка/email).

### 8.15 Уведомления
Открывается из колокольчика. Sheet.
- `GET /api/notifications/unread`, `GET /api/notifications/unread/count` (для бэйджа).
- Действия: тап → deep link (`data.url`); swipe → `PATCH /api/notifications/:id/read` или `DELETE /api/notifications/:id`; «Прочитать все» → `PATCH /api/notifications/read-all`.
- Real-time: `notification:new`.

### 8.16 Настройки (`(tabs)/more/settings/`)
Разделы (зеркалят web `settings`):
1. **Личные данные** — имя, email, телефон, аватар (выбор/съёмка → `PATCH /api/users/:id`).
2. **Уведомления** — каналы (Email/Push/SMS) + типы (Новые сделки / Новые сообщения / Изменения в задачах / Напоминания / Системные) + Тихий режим (расписание). → `PATCH /api/users/me/notification-prefs` (⚠️ добавить на backend, §23).
3. **Безопасность** — смена пароля; 2FA вкл/выкл (`POST /api/auth/2fa/enable|verify|disable`); биометрия для входа (toggle); текущая сессия.
4. **Язык и регион** — RU/EN/TH.
5. **Отображение** — тема (только Dark, плейсхолдер).
6. **Организация** — название, валюта: `GET /api/organizations/current`, `PATCH /api/organizations/current` (только `ADMIN`/`OWNER`). Удаление организации — кнопка ведёт в web.
7. **Интеграции** — статус подключённых: `GET /api/integrations`, `GET /api/integrations/:id/status`, connect `POST /api/integrations/:id/connect`, disconnect `DELETE /api/integrations/:id/disconnect`. Telegram-боты: `GET /api/telegram/bots`, добавить `POST /api/telegram/bots`. WhatsApp-аккаунты: `GET /api/whatsapp/accounts`, `POST /api/whatsapp/accounts`. Email-аккаунты (IMAP): `GET /api/email-imap/accounts`, `GET /api/email-imap/providers`, добавить `POST /api/email-imap/accounts`, тест `POST /api/email-imap/accounts/test`, синк `POST /api/email-imap/accounts/:id/sync`.
8. **Теги** — `GET /api/tags`, `POST /api/tags`, `GET/PATCH/DELETE /api/tags/:id`.
9. **Тариф** — просмотр текущего тарифа; оплата/смена — кнопка в web.
10. **О приложении** — версия, build, политика, условия, выход.

---

## 9. Real-time архитектура

### 9.1 Подключение
- URL `<API_URL>`, namespace `/`, `transports: ['websocket']`.
- Авторизация: `auth: { token: accessToken }` в handshake.
- Обновление токена: `socket.auth.token = newToken; socket.disconnect(); socket.connect();`.
- Background: закрываем соединение через 30 сек; при возврате — реконнект + `invalidateQueries` + дельта-фетч `?updatedSince=`.

### 9.2 Комнаты и подписки
Backend (`WebsocketsGateway`) сам добавляет в `user:<id>`, `role:<UserRole>`, `team:<teamId>`. Подписки экранов:
- `socket.emit('subscribe', { channel, entityId })` — `chat:<contactId>`, `deal:<dealId>`, `contact:<contactId>`, `pipeline:<pipelineId>`.
- При выходе с экрана — `socket.emit('unsubscribe', { channel, entityId })`.

### 9.3 События (контракт)
Формат: `{ type: string; data: T; timestamp: string; actorId?: string }`.

**Глобальные** (`user:<id>` / `role:<role>`): `notification:new`, `userOnline`, `userOffline`, `deal:created|updated|deleted|moved`, `lead:created|updated|assigned`, `task:created|updated|completed|assigned`, `message:new`, `contact:created|updated`, `activity:created`.

**По подписке:** `chat:<id>` → `message:new`, `message:read`, `chat:typing`; `deal:<id>` → `activity:created`, `task:created`, `message:new`; `pipeline:<id>` → `deal:moved`.

### 9.4 Обновление кэша
Каждое событие → маппинг на queryKey: точечный `queryClient.setQueryData` для detail + `invalidateQueries` для списков и `['analytics','dashboard']`.

### 9.5 Optimistic updates
Drag&drop Kanban, отправка сообщения, чекбокс задачи, статусные действия: локально применяем → mutation → откат+тост при ошибке → замена на серверный ответ при успехе.

### 9.6 Дельта-синхронизация
При возврате из background / восстановлении сети: `GET /api/<entity>?updatedSince=<lastSyncAt>` (⚠️ фильтр добавить на backend, §23) → merge в MMKV-кэш. Курсор `lastSyncAt` — per-collection.

---

## 10. Push-уведомления

### 10.1 Регистрация устройства
- После логина: `Notifications.requestPermissionsAsync()` → `getExpoPushTokenAsync({ projectId })`.
- `POST /api/notifications/devices` body `{ token, platform, deviceModel, appVersion, locale }` (⚠️ добавить на backend, §23).
- При logout: `DELETE /api/notifications/devices/:token`.

### 10.2 Payload
```json
{
  "title": "...", "body": "...",
  "data": { "type": "deal_assigned|lead_created|message_new|task_due|mention|booking|system",
            "url": "sintara://deals/abc", "entityId": "abc", "actorId": "user_x" },
  "android": { "channelId": "default|high|messages" },
  "ios": { "sound": "default", "_category": "MESSAGE" }
}
```

### 10.3 Каналы (Android) / Categories (iOS)
- `default` — обычные обновления.
- `high` — критичное (новый лид, упоминание, просроченная задача, новая запись).
- `messages` — сообщения клиентов (Reply action из пуша).

### 10.4 Поведение
- Foreground — in-app баннер + `Haptics.notificationAsync(Success)`.
- Background — системный push, тап → deep link.
- Группировка по `entityId`/`chatId` (iOS threading + Android summary).
- Rate limit на backend: ≤ 1 push / 5 сек от одного `actorId` по одному диалогу.
- Silent push (`contentAvailable: true`, `data.action='sync'`) — фоновая дельта-синхронизация.
- Типы пушей мапятся на настройки нотификаций пользователя (§8.16.2).

---

## 11. Offline и синхронизация

### 11.1 Чтение
`useQuery`: `staleTime 30s`, `gcTime 24h`, persist через MMKV (TanStack persist plugin). Офлайн → кэш + маркер «офлайн» в шапке.

### 11.2 Запись (Outbox)
Очередь в MMKV для: задачи, активности, заметки, сообщения, смена статуса задачи.
```ts
type OutboxItem = { id: string; endpoint: string; body: unknown; createdAt: string; retries: number; lastError?: string };
```
- Offline → мутация в outbox + optimistic update с `pending`-маркером.
- Сеть появилась (`NetInfo`) → FIFO-обработка, ≤ 3 параллельно, exponential retry.
- Успех → замена optimistic на серверную запись; 4xx → снять с очереди + ошибка; 5xx/network → оставить.
- Лимит 100; переполнение → drop старейших + alert.

### 11.3 Только онлайн (не в outbox)
Drag&drop сделок, изменение сумм/полей сделок, удаления, merge, конвертация лида, статусные действия booking.

### 11.4 Конфликты
v1 — **server wins**. Серверная версия с `updatedAt > local.updatedAt` перезаписывает. Если был грязный pending — тост «Изменения коллеги перезаписали ваши».

---

## 12. Аутентификация

| Токен | Хранилище | TTL |
|---|---|---|
| `accessToken` | memory (zustand) + MMKV encrypted | 15 мин |
| `refreshToken` | expo-secure-store (Keychain/Keystore) | 30 дней |

- Интерсептор: `Authorization: Bearer`; на 401 → `POST /api/auth/refresh` → ретрай; второй 401 → logout. Логика 1:1 с `apps/frontend/src/lib/api.ts`.
- Биометрия: toggle в настройках; при включении — подтверждение биометрии + пароль; refresh сохраняется с `biometricBound=true`, `accessControl: BIOMETRY_CURRENT_SET`.
- **Мультиорганизация:** эндпоинт `POST /api/auth/switch-organization` подтверждён. `GET /api/organizations/my` — список организаций пользователя. Переключение — в drawer профиля; после switch — `invalidateQueries()` (весь кэш), реконнект сокета.
- Logout: `POST /api/auth/logout` → `DELETE /api/notifications/devices/:token` → очистка SecureStore+MMKV (кроме preferences) → дисконнект сокета → `(auth)/sign-in`.

---

## 13. RBAC на клиенте

Роли: `User.role` (`ADMIN|MANAGER|OPERATOR|SUPERVISOR`), `OrgMember.role` (`OWNER|ADMIN|MANAGER|OPERATOR`).

| Действие | OPERATOR | MANAGER | SUPERVISOR | ADMIN/OWNER |
|---|---|---|---|---|
| Свои сделки/лиды/задачи | ✅ | ✅ | ✅ | ✅ |
| Все по орг | ❌ | ✅ | ✅ | ✅ |
| Переназначать ответственного | ❌ | свои | ✅ | ✅ |
| Удалять сделки/контакты | ❌ | свои | ✅ | ✅ |
| Merge дубликатов | ❌ | ✅ | ✅ | ✅ |
| Аналитика | ❌ | ✅ | ✅ | ✅ |
| Раздел «Команда» (просмотр) | ❌ | ✅ | ✅ | ✅ |
| Смена ролей / активация / удаление членов | ❌ | ❌ | ❌ | ✅ |
| Приглашения | ❌ | ❌ | ❌ | ✅ |
| Настройки организации / интеграции | ❌ | ❌ | ❌ | ✅ |
| Автоматизации: вкл/выкл/запуск | ❌ | ✅ | ✅ | ✅ |

Хелпер `useCan(action)` в `src/lib/permissions.ts`; компонент `<Can action="...">`. Backend всё равно валидирует — клиентский RBAC только для UX.

---

## 14. Локализация

- Языки v1: `ru` (дефолт), `en`, `th` (Thailand demo — есть `currency: THB` и тайский seed).
- `i18next` + `react-i18next`; файлы `src/i18n/locales/{ru,en,th}.json`, namespaces по доменам.
- Определение: `expo-localization` → fallback `ru`. Переключение в настройках → MMKV.
- Числа/валюта: `Intl.NumberFormat(locale, { style:'currency', currency: org.currency })`.
- Даты: `date-fns` (`ru/enUS/th`) + относительные («5 мин назад»).
- Телефоны: хранение E.164, отображение через `libphonenumber-js` (как web `phone-input.tsx`).

---

## 15. Производительность — бюджеты

| Метрика | Бюджет |
|---|---|
| Cold start TTI | ≤ 2.5 сек (iPhone 13 / Pixel 6) |
| Скролл списков | 60 fps, < 1% dropped frames |
| Размер бандла | ≤ 25 MB iOS / ≤ 35 MB Android |
| Memory baseline | ≤ 180 MB |
| UI-отклик «отправить сообщение» (optimistic) | < 50 мс |
| Push → отображение | < 2 сек end-to-end |

Правила: все списки — `FlashList` с `estimatedItemSize`; `renderItem` через `useCallback`; изображения — `expo-image` (`cachePolicy memory-disk` + blurhash); тяжёлые анимации — Reanimated worklets / Skia; никаких таймеров без cleanup.

---

## 16. Безопасность

1. HTTPS only; cert pinning (production) — опц. после v1.
2. access — в памяти; refresh — Keychain/Keystore. Никаких токенов в открытом виде.
3. Биометрия invalidate-on-passcode-change.
4. Privacy-overlay при backgrounding (splash поверх превью в таск-свитчере) + `expo-screen-capture` на чувствительных экранах.
5. Валидация deep-link payload — без unsafe redirects.
6. Server-side валидация — уже есть (`class-validator`).
7. Логи: никогда не логировать токены/пароли/тела сообщений. Sentry — только стеки + breadcrumbs + tags (`userId`, `orgId`).
8. Клиентский rate limit: debounce search, throttle mutation-кнопок.

---

## 17. Accessibility

- `accessibilityLabel` + `accessibilityRole` на всех интерактивных элементах.
- Hit area ≥ 44×44 pt (iOS) / 48×48 dp (Android).
- Контраст WCAG AA; для тёмной темы text-on-bg ≥ 7:1 (primary), ≥ 4.5:1 (secondary).
- Dynamic Type / font scaling — `allowFontScaling: true` (кроме бэйджей/иконок).
- VoiceOver/TalkBack — проверить логин, создание сделки, отправку сообщения.
- `AccessibilityInfo.isReduceMotionEnabled()` → отключение анимаций (как `prefers-reduced-motion` в web `globals.css`).

---

## 18. Тестирование

| Уровень | Инструмент | Покрытие |
|---|---|---|
| Unit (логика, утилиты, сторы) | jest + RTL | ≥ 70% |
| Component (UI-примитивы) | jest + RTL | ключевые |
| Contract (mock API) | MSW | все эндпоинты |
| E2E | maestro | сценарии ниже |
| Performance | flashlight | бюджеты §15 |

**E2E flows:** (1) login → Today → Deals → карточка → logout; (2) Quick add → задача → проверка в Today; (3) Inbox → диалог → отправка; (4) push → tap → deep link на сделку; (5) offline создание задачи → online → синк; (6) logout → биометрия → автологин; (7) лид → конвертация → проверка сделки; (8) переключение организации.

Тестовое окружение: backend через `pnpm docker:up` (есть `docker-compose.yml`/`Makefile`), seed через `pnpm db:seed` (`apps/backend/prisma/seed.ts`).

---

## 19. CI/CD и релиз

### 19.1 CI (`mobile-ci.yml`)
checkout → setup-node@20 + pnpm → `pnpm install --frozen-lockfile` → lint → `tsc --noEmit` → `jest` → (опц.) Maestro cloud на preview-билде.

### 19.2 EAS Build (`eas.json`)
Профили `development` (dev client, internal), `preview` (internal, channel preview), `production` (channel production, autoIncrement). `submit.production` — Apple ASC + Google service account.

Окружения через `app.config.ts`: dev → `localhost:3001`; preview → staging; production → prod API. Секреты — `eas secret`.

### 19.3 OTA
EAS Update для JS-фиксов (не для нативных модулей). `runtimeVersion.policy: 'fingerprint'`. Каналы синхронны с EAS Build.

### 19.4 Сторы
- iOS: TestFlight → внутр./внешн. тестеры → App Store. `Info.plist`: NSCamera/Contacts/Microphone/LocationWhenInUse/FaceID/PhotoLibrary/CalendarsUsageDescription.
- Android: Internal → Closed → Open → Production. Permissions: CAMERA, READ_CONTACTS, RECORD_AUDIO, POST_NOTIFICATIONS, USE_BIOMETRIC, READ_CALENDAR.
- Privacy Policy / Terms — ссылки в приложении.
- SemVer `MAJOR.MINOR.PATCH`, build number — auto через EAS.

---

## 20. Аналитика и observability

**PostHog events:** `app_open`, `login_success/failed`, `screen_view`, `deal_created/moved/closed_won/closed_lost`, `lead_converted`, `task_completed`, `message_sent`, `push_received/opened`, `offline_mutation_queued/synced`, `org_switched`, `automation_toggled`.

**Sentry:** все unhandled exceptions, network 5xx (tag `endpoint`), performance transactions на ключевых экранах, release tracking на каждый билд.

**Логи:** dev — `console.log` ок; prod — только `Sentry.addBreadcrumb`/`captureMessage` (eslint-rule запрещает `console` в release).

---

## 21. Дорожная карта (5 фаз, ~11–12 недель)

### Фаза 1 — Foundation (1.5 нед.)
Init Expo SDK 51, expo-router, TS strict, NativeWind/Unistyles + dark-токены, UI-примитивы (Button, Input, Card, Sheet, GlassCard, Segmented, Skeleton, Badge). Auth flow (sign-in/up, 2FA, accept-invite, refresh-интерсептор, SecureStore, мультиорг-switch). Socket.IO singleton + reconnect. TanStack Query + axios + MMKV persister. Навигация: 5 табов + хаб «Ещё» + drawer профиля + шапка. CI-скелет.
**Выход:** логин, переключение организаций, пустой каркас, welcome-push.

### Фаза 2 — Чтение всех сущностей (2.5 нед.)
Today/Дашборд. Сделки (список + Kanban + карточка). Лиды. Контакты + Компании (список + карточка + дубли-просмотр). Задачи (список + календарь). Каталог. Команда (список + статистика). Автоматизации (список + просмотр). Booking (просмотр). Аналитика. Активности. Инбокс (список + диалог, чтение). Уведомления. Глобальный поиск. Real-time подписки + обновление кэша.
**Выход:** менеджер видит весь CRM в дороге.

### Фаза 3 — Запись и мутации (3 нед.)
Создание/редактирование: сделки, лиды, контакты, компании, задачи (+ recurring), активности, заметки, товары. Drag&drop Kanban + смена этапа + won/lost + duplicate. Конвертация лида. Merge дубликатов. Отправка сообщений (все каналы). Quick Add. Создание брони + статусные действия + лист ожидания. Автоматизации: вкл/выкл/запуск. Команда: смена роли/активация, приглашения. Optimistic updates. Outbox.
**Выход:** полноценная работа без веба.

### Фаза 4 — Power features (2.5 нед.)
Push end-to-end (регистрация устройств, типы, deep links, reply-from-push). Импорт контактов/компаний (телефон + файл) + экспорт-share. Сканер визиток (OCR). Биометрия. Интеграции: статус, connect/disconnect, добавление email/Telegram/WhatsApp, привязка нераспознанных чатов. Настройки нотификаций. Дельта-синхронизация.

### Фаза 5 — Polish & Release (2 нед.)
Локализация RU/EN/TH. A11y-проход. Performance budgets. E2E Maestro. Иконки/Splash/Store assets. TestFlight + Internal testing. App Store + Google Play submission.

**v2+:** light theme, iPad split-view, watchOS/Wear notifications, конструктор автоматизаций на мобильном, видеозвонки (WebRTC), Siri Shortcuts.

---

## 22. Acceptance criteria (v1)

- [ ] Регистрация, вход (+2FA), приглашение по ссылке, биометрия, мультиорг-переключение, выход — работают.
- [ ] Today показывает актуальные задачи/метрики/записи; pull-to-refresh работает.
- [ ] Сделки: список, Kanban с drag&drop, карточка, создание, won/lost/duplicate — синхронны с web в реальном времени.
- [ ] Лиды: список, карточка, «взять в работу», конвертация в сделку — работают.
- [ ] Инбокс: Telegram/WhatsApp/Email/internal в одной ленте; отправка/получение; новые сообщения приходят пушем в фоне; привязка нераспознанных чатов.
- [ ] Контакты/Компании: список, карточка, создание, дубли + merge, импорт (телефон+файл), экспорт.
- [ ] Задачи: список, календарь, создание (+ recurring), выполнение.
- [ ] Каталог товаров: CRUD, привязка к сделке.
- [ ] Команда: список, онлайн-статусы, статистика; для ADMIN — смена ролей, активация, приглашения.
- [ ] Автоматизации: список, просмотр, вкл/выкл, ручной запуск.
- [ ] Booking: ресурсы, услуги, слоты, создание брони, статусы, лист ожидания.
- [ ] Аналитика: 4 эндпоинта (dashboard, funnel, sales, activity) отрисованы.
- [ ] Уведомления: список, прочтение, push, deep links < 5 сек.
- [ ] Настройки: профиль, нотификации, безопасность, язык, организация, интеграции, теги.
- [ ] Глобальный поиск по 6 сущностям.
- [ ] Offline: чтение кэша + outbox-синк задач.
- [ ] Локализация RU/EN/TH — без hard-coded строк.
- [ ] Performance: cold start ≤ 2.5s, списки 60 fps.
- [ ] CI зелёный (lint + type + unit + e2e smoke); билды собираются через EAS.
- [ ] Crash-free sessions ≥ 99.5% на первой неделе beta.
- [ ] Все privacy-permissions описаны; submission в App Store / Google Play принят.

---

## 23. Доработки backend (changelog)

К началу Фазы 1 в `apps/backend` нужно добавить (отдельные PR с тестами):

1. `POST /api/notifications/devices` — регистрация push-токена `{ token, platform, deviceModel, appVersion, locale }`.
2. `DELETE /api/notifications/devices/:token` — снятие.
3. `PATCH /api/users/me/notification-prefs` — настройки нотификаций (каналы + типы + тихий режим).
4. `POST /api/auth/forgot-password` — если ещё нет.
5. На все list-эндпоинты — фильтр `?updatedSince=<ISO>` (для дельта-синка) и курсорная пагинация `?cursor=`.
6. Подтвердить роутинг отправки в каналы: `POST /api/messages/send` должен сам направлять в Telegram/WhatsApp/Email по `channel`, либо мобильный использует `/telegram/send` `/whatsapp/send` `/email-imap/emails/send` напрямую — зафиксировать до Фазы 3.
7. Push-сервис (Expo Push API) на стороне backend, если ещё не реализован, — для отправки на зарегистрированные устройства по событиям.

---

## 24. Конвенции кода

- Один экран = один файл, ≤ ~200 LOC; сверх — в `components/<domain>/`.
- Без `any` (иначе `// FIXME:` + issue).
- Хуки `useXxx`, один хук = один query/mutation/effect.
- Сторы Zustand: `src/store/<feature>.store.ts`, slice-pattern.
- Импорты: react/RN → внешние → `@/...` → relative (ESLint `import/order`).
- Цвета — только `theme.colors.*` или NativeWind-классы, без хексов в JSX.
- Эндпоинты — только из `src/api/`, имена методов зеркалят web `apps/frontend/src/lib/api.ts`.
- Git: ветки `mobile/<feature>`, Conventional Commits (`feat(mobile): ...`), squash перед merge, PR с GIF-скринами.

Шаблон экрана:
```tsx
// app/(tabs)/deals/[id].tsx
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDeal } from '@/hooks/useDeal';
import { DealHeader, DealTabs, DealActionsBar } from '@/components/deals';
import { ScreenError, ScreenSkeleton } from '@/components/ui';

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deal, isLoading, error } = useDeal(id);
  if (isLoading) return <ScreenSkeleton kind="deal" />;
  if (error) return <ScreenError error={error} />;
  if (!deal) return <ScreenError kind="not-found" />;
  return (
    <>
      <Stack.Screen options={{ title: deal.name }} />
      <DealHeader deal={deal} />
      <DealTabs dealId={deal.id} />
      <DealActionsBar deal={deal} />
    </>
  );
}
```

---

## 25. Глоссарий

| Термин | Значение |
|---|---|
| `Pipeline` / `Stage` | Воронка продаж / её этап (NEW…SUCCESS/LOST) |
| `Deal` | Сделка — основной объект продажи |
| `Lead` | Лид — кандидат до квалификации; конвертируется в Deal+Contact |
| `Contact` / `Company` | Контакт (физлицо) / Компания (юрлицо) |
| `Activity` | Действие на таймлайне (звонок/встреча/заметка/email) |
| `Task` | Задача исполнителю (может быть recurring) |
| `Message` / Conversation | Сообщение из канала / тред переписки с контактом |
| `Product` / `DealProduct` | Товар каталога / товар, привязанный к сделке |
| `Booking` / `Resource` / `Service` | Запись на услугу / ресурс / услуга |
| `Automation` | Сценарий: триггер + условия + действия |
| `Tag` | Метка для контактов/сделок/лидов |
| `Invitation` | Приглашение сотрудника в организацию |
| `OrgMember` / `OrgRole` | Членство в организации / роль в ней |
| `UserRole` | Глобальная роль пользователя |

---

## 26. Открытые вопросы (зафиксировать до Фазы 1)

1. **Push на email-сообщения** — всегда или по prefs? (Реализуется через `notification-prefs`.)
2. **Reply-from-push для WhatsApp/Telegram** — поддерживаем в v1? (Требует отправки в канал из notification-action без открытия чата.)
3. **NativeWind vs Unistyles 3** — финальный выбор (скорость разработки vs 120fps-полировка).
4. **Booking** — обязателен в v1 для всех или feature-flag по типу организации? (Для тайского рынка услуг — да.)
5. **Роутинг отправки сообщений** — единый `/messages/send` или прямые канальные эндпоинты (см. §23.6).
6. **Лимиты API / 429** — есть ли rate limit на стороне backend и где обрабатывать `429` на клиенте.

---

*Конец ТЗ v2.0. Правки — через PR в этот файл с описанием «что меняется и почему» в commit message.*
