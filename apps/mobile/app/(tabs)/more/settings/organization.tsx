import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { organizationsApi } from '@/api';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import {
  Button,
  Input,
  ScreenError,
  ScreenSkeleton,
  Text,
} from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/lib/toast';
import { spacing } from '@/theme';

/** Организация (ТЗ §8.16.6): просмотр, редактирование — ADMIN/OWNER. */
export default function OrganizationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const canManage = useCan('organization.manage');

  const { data: org, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations', 'current'],
    queryFn: organizationsApi.current,
  });

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (org) setName(org.name);
  }, [org]);

  const onSave = async () => {
    setSaving(true);
    try {
      await organizationsApi.updateCurrent({ name });
      toast.success('Организация обновлена');
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Организация" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !org) {
    return (
      <CosmicBg>
        <StackHeader title="Организация" />
        <ScreenError error={error} onRetry={refetch} />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader title="Организация" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {canManage ? (
          <>
            <Input label="Название" value={name} onChangeText={setName} />
            <GlassCard style={styles.card}>
              <InfoRow label="Валюта" value={org.currency} />
              <InfoRow label="Идентификатор" value={org.slug} />
            </GlassCard>
            <Button
              title="Сохранить"
              loading={saving}
              disabled={!name.trim() || name === org.name}
              onPress={onSave}
            />
            <Text variant="caption" tone="muted" center>
              Удаление организации и смена тарифа — в веб-версии.
            </Text>
          </>
        ) : (
          <GlassCard style={styles.card}>
            <InfoRow label="Название" value={org.name} />
            <InfoRow label="Валюта" value={org.currency} />
            <InfoRow label="Идентификатор" value={org.slug} />
          </GlassCard>
        )}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { padding: spacing[4] },
});
