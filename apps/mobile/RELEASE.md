# Релиз Sintara CRM Mobile

Гайд по сборке и публикации (ТЗ §19). Bundle id: `com.sintara.crm.mobile`
(`.dev` / `.staging` для соответствующих профилей).

## 0. Предусловия

- Node ≥ 20, pnpm 8.15+, Xcode 15.4+, Android SDK 34.
- Аккаунт Expo (`npx expo login`), `npm i -g eas-cli`.
- `eas init` — привязать проект, получить `projectId` → вписать в
  `app.config.ts` (`extra.eas.projectId`) и `updates.url`.
- Apple Developer + Google Play Console аккаунты.

## 1. Окружения

`APP_ENV` (`development` | `preview` | `production`) выбирает `API_URL`
в `app.config.ts`. Секреты — через `eas secret:create`.

## 2. Сборки (EAS Build)

```bash
# Dev-client (для разработки и Maestro E2E)
eas build --profile development --platform all

# Внутреннее тестирование (TestFlight / Internal)
eas build --profile preview --platform all

# Продакшн
eas build --profile production --platform all
```

Профили — в `eas.json`. `production` использует `autoIncrement` build number.

## 3. Публикация (EAS Submit)

```bash
eas submit --profile production --platform ios       # → App Store Connect
eas submit --profile production --platform android   # → Google Play
```

Заполнить в `eas.json` → `submit.production`: `appleId`, `ascAppId`,
`appleTeamId`; для Android — `google-service-account.json`.

## 4. OTA-обновления

```bash
eas update --branch production --message "JS-фикс"
```

`runtimeVersion.policy: 'fingerprint'` — OTA только для JS-изменений,
не для нативных модулей (нужна новая сборка).

## 5. Чеклист перед публикацией

- [ ] `app.config.ts`: `extra.eas.projectId`, `updates.url` заполнены.
- [ ] Реальные иконки: `assets/icons/icon.png` (1024×1024 без альфы),
      `adaptive-icon.png` (foreground), splash. Сейчас — плейсхолдеры.
- [ ] Privacy permission-тексты в `infoPlist` / Android `permissions` —
      проверены (камера, контакты, микрофон, геолокация, Face ID).
- [ ] Privacy Policy / Terms — реальные URL в `settings/about`.
- [ ] `pnpm lint && pnpm type-check && pnpm test` — зелёные.
- [ ] Maestro smoke (`.maestro/`) — пройден на preview-сборке.
- [ ] Backend §23 задеплоен (push-сервис, `/notifications/devices`,
      `/users/me/notification-prefs`, `?updatedSince=`) — иначе push
      и серверный синк не работают.
- [ ] App Store metadata + скриншоты; Google Play listing.

## 6. CI

`.github/workflows/mobile-ci.yml`: lint · type-check · unit на каждый
push в `mobile/**`. E2E Maestro запускается отдельно на preview-сборке
(см. `.maestro/README.md`).

## 7. Известные зависимости вне приложения

- **Backend §23** — push end-to-end, notification-prefs, дельта-синк.
- **OCR визиток** — нужен нативный MLKit-плагин (`vision-camera` +
  text-recognition); сейчас сканер делает снимок без распознавания.
