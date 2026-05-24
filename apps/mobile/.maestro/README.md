# E2E-тесты (Maestro)

Сценарии для [Maestro](https://maestro.mobile.dev) — ТЗ §18.

## Запуск

```bash
# Установка Maestro
curl -fsSL https://get.maestro.mobile.dev | bash

# Прогон всех сценариев на запущенном симуляторе/устройстве
maestro test apps/mobile/.maestro

# Отдельный сценарий
maestro test apps/mobile/.maestro/smoke.yaml
```

## ⚠️ Важно

- `appId` в каждом файле — `com.sintara.crm.mobile`. Для dev/preview-сборок
  bundle id отличается (`.dev` / `.staging`, см. `app.config.ts`).
  Переопределяйте при запуске или правьте перед прогоном CI.
- `login.yaml` ожидает учётку из `env` (по умолчанию `manager@sintara.crm`).
  Окружение должно быть поднято с seed-данными (`pnpm db:seed`).
- Перед прогоном собрать dev-client (`eas build --profile development`)
  и установить на устройство/симулятор.

## Сценарии

| Файл | Сценарий ТЗ §18 |
|---|---|
| `login.yaml` | Вход (переиспользуется через `runFlow`) |
| `smoke.yaml` | login → Today → Deals → сегменты → возврат |
| `quick-add-task.yaml` | Quick Add → создание задачи |
| `global-search.yaml` | Глобальный поиск |
| `logout.yaml` | Выход через drawer профиля |

## Остаётся дописать

Сценарии, требующие управления состоянием устройства:
push→deep-link, offline-создание→синк, биометрия-автологин,
конвертация лида, переключение организаций — добавляются после
настройки seed-фикстур и device-hooks.
