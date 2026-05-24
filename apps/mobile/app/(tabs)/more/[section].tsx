import { useLocalSearchParams } from 'expo-router';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  Contact,
  ListChecks,
  Package,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { CosmicBg } from '@/components/glass';
import { Placeholder, StackHeader } from '@/components/layout';

/**
 * Раздел хаба «Ещё». Фаза 1 — каркас: единый экран для всех разделов.
 * В Фазах 2–3 каждый раздел разворачивается в свой набор экранов
 * (см. структуру apps/mobile в ТЗ §5).
 */
const SECTIONS: Record<string, { labelKey: string; icon: LucideIcon; caption: string }> = {
  contacts: {
    labelKey: 'more.contacts',
    icon: Contact,
    caption: 'Контакты: список, поиск, дубли + merge, импорт и экспорт.',
  },
  companies: {
    labelKey: 'more.companies',
    icon: Building2,
    caption: 'Компании: список, карточка, дубли + merge, импорт.',
  },
  tasks: {
    labelKey: 'more.tasks',
    icon: ListChecks,
    caption: 'Задачи: сегменты, календарь, повторяющиеся задачи.',
  },
  products: {
    labelKey: 'more.products',
    icon: Package,
    caption: 'Каталог товаров и привязка к сделкам.',
  },
  team: {
    labelKey: 'more.team',
    icon: Users,
    caption: 'Команда: онлайн-статусы, статистика, роли, приглашения.',
  },
  booking: {
    labelKey: 'more.booking',
    icon: CalendarClock,
    caption: 'Онлайн-запись: ресурсы, услуги, слоты, лист ожидания.',
  },
  automations: {
    labelKey: 'more.automations',
    icon: Zap,
    caption: 'Автоматизации: список, просмотр, вкл/выкл, ручной запуск.',
  },
  analytics: {
    labelKey: 'more.analytics',
    icon: BarChart3,
    caption: 'Аналитика: выручка, воронка, продажи, активность.',
  },
  activities: {
    labelKey: 'more.activities',
    icon: Activity,
    caption: 'Глобальный таймлайн активностей с фильтрами.',
  },
  settings: {
    labelKey: 'more.settings',
    icon: Settings,
    caption: 'Профиль, уведомления, безопасность, язык, интеграции, теги.',
  },
};

export default function MoreSectionScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section: string }>();
  const config = section ? SECTIONS[section] : undefined;

  return (
    <CosmicBg>
      <StackHeader title={config ? t(config.labelKey) : t('common.notFound')} />
      <Placeholder icon={config?.icon} caption={config?.caption} />
    </CosmicBg>
  );
}
