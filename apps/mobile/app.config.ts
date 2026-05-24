import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Окружения выбираются через APP_ENV (см. eas.json).
 *  - development → локальный backend
 *  - preview     → staging
 *  - production  → prod
 * Секреты (Sentry DSN, PostHog key) подставляются через `eas secret`.
 */
type AppEnv = 'development' | 'preview' | 'production';

const APP_ENV = (process.env.APP_ENV as AppEnv) ?? 'development';

const ENV: Record<AppEnv, { apiUrl: string; name: string; bundleSuffix: string }> = {
  development: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3001',
    name: 'Sintara CRM (Dev)',
    bundleSuffix: '.dev',
  },
  preview: {
    apiUrl: process.env.API_URL ?? 'https://staging-api.sintara.crm',
    name: 'Sintara CRM (Staging)',
    bundleSuffix: '.staging',
  },
  production: {
    apiUrl: process.env.API_URL ?? 'https://api.sintara.crm',
    name: 'Sintara CRM',
    bundleSuffix: '',
  },
};

const current = ENV[APP_ENV];
const BUNDLE_ID = `com.sintara.crm.mobile${current.bundleSuffix}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: current.name,
  slug: 'sintara-crm-mobile',
  scheme: 'sintara',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  icon: './assets/icons/icon.png',
  splash: {
    image: './assets/splash/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a12',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
    infoPlist: {
      NSCameraUsageDescription:
        'Камера используется для сканирования визиток и съёмки аватара.',
      NSContactsUsageDescription:
        'Доступ к контактам нужен для импорта клиентов в CRM.',
      NSMicrophoneUsageDescription:
        'Микрофон используется для записи голосовых сообщений.',
      NSLocationWhenInUseUsageDescription:
        'Геолокация используется для отметки места встречи с клиентом.',
      NSPhotoLibraryUsageDescription:
        'Доступ к фото нужен для выбора аватара и вложений.',
      NSCalendarsUsageDescription:
        'Календарь используется для синхронизации задач и встреч.',
      NSFaceIDUsageDescription: 'Face ID используется для быстрого входа в приложение.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      foregroundImage: './assets/icons/adaptive-icon.png',
      backgroundColor: '#8B5CF6',
    },
    permissions: [
      'CAMERA',
      'READ_CONTACTS',
      'RECORD_AUDIO',
      'POST_NOTIFICATIONS',
      'USE_BIOMETRIC',
      'READ_CALENDAR',
      'ACCESS_FINE_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-local-authentication',
    [
      'expo-splash-screen',
      {
        image: './assets/splash/splash.png',
        backgroundColor: '#0a0a12',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: { deploymentTarget: '15.1' },
        android: { minSdkVersion: 26 },
      },
    ],
  ],
  // typedRoutes включим в Фазе 2, когда роуты стабилизируются и динамические
  // переходы (router.push(`/(tabs)/more/${key}`)) будут типизированы через Href.
  extra: {
    apiUrl: current.apiUrl,
    appEnv: APP_ENV,
    eas: {
      // projectId: '<EAS_PROJECT_ID>', // задаётся через `eas init`
    },
  },
  runtimeVersion: {
    policy: 'fingerprint',
  },
  updates: {
    // url: 'https://u.expo.dev/<EAS_PROJECT_ID>', // задаётся через `eas update:configure`
  },
});
