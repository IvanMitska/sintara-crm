import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usersApi, type NotificationPrefs } from '@/api';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Text } from '@/components/ui';
import { kv } from '@/lib/storage';
import { colors, spacing } from '@/theme';

const PREFS_KEY = 'app.notificationPrefs';

const DEFAULT_PREFS: NotificationPrefs = {
  channels: { email: true, push: true, sms: false },
  types: {
    newDeals: true,
    newMessages: true,
    taskUpdates: true,
    reminders: true,
    system: true,
  },
  quietHours: { enabled: false, from: '22:00', to: '08:00' },
};

/**
 * Настройки уведомлений (ТЗ §8.16.2). Сохраняются локально (MMKV) и
 * синхронизируются с backend — PATCH /users/me/notification-prefs (§23.3).
 */
export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    () => kv.getJSON<NotificationPrefs>(PREFS_KEY) ?? DEFAULT_PREFS,
  );

  const persist = (next: NotificationPrefs) => {
    setPrefs(next);
    kv.setJSON(PREFS_KEY, next);
    // Лучшие усилия: эндпоинт §23.3 может ещё не существовать.
    void usersApi.updateNotificationPrefs(next).catch(() => undefined);
  };

  const toggleChannel = (key: keyof NotificationPrefs['channels']) =>
    persist({ ...prefs, channels: { ...prefs.channels, [key]: !prefs.channels[key] } });

  const toggleType = (key: keyof NotificationPrefs['types']) =>
    persist({ ...prefs, types: { ...prefs.types, [key]: !prefs.types[key] } });

  return (
    <CosmicBg>
      <StackHeader title="Уведомления" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="subhead" weight="semibold" tone="secondary">
          Каналы
        </Text>
        <GlassCard style={styles.card}>
          <Row label="Push" value={prefs.channels.push} onChange={() => toggleChannel('push')} />
          <Row label="Email" value={prefs.channels.email} onChange={() => toggleChannel('email')} />
          <Row label="SMS" value={prefs.channels.sms} onChange={() => toggleChannel('sms')} last />
        </GlassCard>

        <Text variant="subhead" weight="semibold" tone="secondary">
          Типы уведомлений
        </Text>
        <GlassCard style={styles.card}>
          <Row label="Новые сделки" value={prefs.types.newDeals} onChange={() => toggleType('newDeals')} />
          <Row label="Новые сообщения" value={prefs.types.newMessages} onChange={() => toggleType('newMessages')} />
          <Row label="Изменения в задачах" value={prefs.types.taskUpdates} onChange={() => toggleType('taskUpdates')} />
          <Row label="Напоминания" value={prefs.types.reminders} onChange={() => toggleType('reminders')} />
          <Row label="Системные" value={prefs.types.system} onChange={() => toggleType('system')} last />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Row
            label="Тихий режим (22:00–08:00)"
            value={prefs.quietHours.enabled}
            onChange={() =>
              persist({
                ...prefs,
                quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled },
              })
            }
            last
          />
        </GlassCard>
      </ScrollView>
    </CosmicBg>
  );
}

function Row({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text variant="body" style={styles.rowLabel}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary600 }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[2] },
  card: { paddingHorizontal: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  rowLabel: { flex: 1 },
});
