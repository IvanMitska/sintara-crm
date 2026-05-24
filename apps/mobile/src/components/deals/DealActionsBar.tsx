/** Sticky-панель действий карточки сделки (ТЗ §8.3, Фаза 3). */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { ArrowRightLeft, Check, ListPlus, Trophy, X } from 'lucide-react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/layout';
import { Sheet, Text } from '@/components/ui';
import { useDealStageAction, useMoveDeal } from '@/hooks/mutations';
import { usePipelines } from '@/hooks/queries';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';
import type { Deal } from '@/types';

export function DealActionsBar({ deal }: { deal: Deal }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const stageSheet = useRef<BottomSheetModal>(null);

  const pipelines = usePipelines();
  const pipelineId = deal.stage?.pipelineId ?? '';
  const pipeline = pipelines.data?.find((p) => p.id === pipelineId);
  const stages = (pipeline?.stages ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);

  const move = useMoveDeal(pipelineId);
  const { win, lose } = useDealStageAction(deal.id);

  const closed = deal.status === 'SUCCESS' || deal.status === 'LOST';

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing[2] },
      ]}
    >
      <Action
        icon={ArrowRightLeft}
        label={t('deals.actionStage')}
        onPress={() => {
          haptics.select();
          stageSheet.current?.present();
        }}
      />
      <Action
        icon={ListPlus}
        label={t('deals.actionTask')}
        onPress={() =>
          router.push(`/(tabs)/more/tasks/new?dealId=${deal.id}` as never)
        }
      />
      <Action
        icon={Trophy}
        label={t('deals.actionWin')}
        color={colors.status.success}
        disabled={closed || win.isPending}
        onPress={() =>
          win.mutate(undefined, {
            onSuccess: () => toast.success(t('deals.wonToast')),
            onError: () => toast.error(t('common.errorShort')),
          })
        }
      />
      <Action
        icon={X}
        label={t('deals.actionLose')}
        color={colors.status.danger}
        disabled={closed || lose.isPending}
        onPress={() =>
          lose.mutate(undefined, {
            onSuccess: () => toast.info(t('deals.lostToast')),
            onError: () => toast.error(t('common.errorShort')),
          })
        }
      />

      <Sheet ref={stageSheet}>
        <Text variant="headline" weight="semibold" style={styles.sheetTitle}>
          {t('deals.changeStage')}
        </Text>
        {stages.map((stage) => {
          const active = stage.id === deal.stageId;
          return (
            <Pressable
              key={stage.id}
              accessibilityRole="button"
              onPress={() => {
                haptics.select();
                stageSheet.current?.dismiss();
                if (!active) {
                  move.mutate(
                    { dealId: deal.id, stageId: stage.id },
                    { onError: () => toast.error(t('deals.stageFailed')) },
                  );
                }
              }}
              style={styles.stageRow}
            >
              <View style={[styles.dot, { backgroundColor: stage.color }]} />
              <Text variant="body" weight={active ? 'semibold' : 'regular'} style={styles.stageName}>
                {stage.name}
              </Text>
              {active ? <Check size={18} color={colors.brand.primary500} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

function Action({
  icon: Icon,
  label,
  onPress,
  color = colors.text.secondary,
  disabled,
}: {
  icon: typeof Check;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled && styles.disabled]}
    >
      <Icon size={22} color={color} />
      <Text variant="caption" weight="medium" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingHorizontal: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.raised,
  },
  action: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  disabled: { opacity: 0.4 },
  sheetTitle: { marginBottom: spacing[2] },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stageName: { flex: 1 },
});
