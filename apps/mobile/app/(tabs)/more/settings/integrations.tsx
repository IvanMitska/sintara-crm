import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Plug } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Integration } from '@/api';
import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import {
  Badge,
  Button,
  Input,
  ScreenError,
  ScreenSkeleton,
  Sheet,
  Text,
} from '@/components/ui';
import {
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/mutations';
import { useIntegrations } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

/** Интеграции (ТЗ §8.16.7): статусы + connect/disconnect. */
export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [target, setTarget] = useState<Integration | null>(null);
  const [token, setToken] = useState('');

  const { data, isLoading, error, refetch } = useIntegrations();
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();

  const openConnect = (integration: Integration) => {
    setTarget(integration);
    setToken('');
    sheetRef.current?.present();
  };

  const onConnect = () => {
    if (!target) return;
    connect.mutate(
      { id: target.id, config: { token } },
      {
        onSuccess: () => {
          toast.success(`${target.name} подключён`);
          sheetRef.current?.dismiss();
        },
        onError: () => toast.error('Не удалось подключить'),
      },
    );
  };

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Интеграции" />
        <ScreenSkeleton kind="list" />
      </CosmicBg>
    );
  }
  if (error) {
    return (
      <CosmicBg>
        <StackHeader title="Интеграции" />
        <ScreenError error={error} onRetry={refetch} />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader title="Интеграции" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(data ?? []).map((it) => {
          const active = it.status === 'active';
          return (
            <GlassCard key={it.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Plug size={18} color={colors.brand.primary500} />
                </View>
                <View style={styles.body}>
                  <Text variant="callout" weight="semibold">
                    {it.name}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {it.description}
                  </Text>
                </View>
                <Badge
                  label={active ? 'Активна' : 'Выключена'}
                  color={active ? colors.status.success : colors.text.muted}
                />
              </View>
              {active ? (
                <Button
                  title="Отключить"
                  variant="danger"
                  loading={disconnect.isPending}
                  onPress={() =>
                    disconnect.mutate(it.id, {
                      onSuccess: () => toast.info(`${it.name} отключён`),
                      onError: () => toast.error('Ошибка'),
                    })
                  }
                />
              ) : (
                <Button
                  title="Подключить"
                  variant="secondary"
                  onPress={() => openConnect(it)}
                />
              )}
            </GlassCard>
          );
        })}
      </ScrollView>

      <Sheet ref={sheetRef}>
        <Text variant="headline" weight="semibold">
          Подключить {target?.name}
        </Text>
        <Text variant="subhead" tone="muted" style={styles.sheetHint}>
          Введите токен/ключ доступа интеграции. Полная настройка с вебхуками —
          в веб-версии.
        </Text>
        <Input
          value={token}
          onChangeText={setToken}
          placeholder="Токен доступа"
          autoCapitalize="none"
        />
        <View style={styles.sheetBtn}>
          <Button
            title="Подключить"
            loading={connect.isPending}
            disabled={!token.trim()}
            onPress={onConnect}
          />
        </View>
      </Sheet>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { padding: spacing[4], gap: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  body: { flex: 1, gap: 2 },
  sheetHint: { marginVertical: spacing[2] },
  sheetBtn: { marginTop: spacing[3] },
});
