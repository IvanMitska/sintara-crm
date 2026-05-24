/** Sticky-панель действий карточки лида (ТЗ §8.3, Фаза 3). */
import { router } from 'expo-router';
import { Briefcase, CircleCheck, Play, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/layout';
import { Button } from '@/components/ui';
import { useConvertLead, useUpdateLead } from '@/hooks/mutations';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';
import type { Lead } from '@/types';

export function LeadActionsBar({ lead }: { lead: Lead }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const update = useUpdateLead(lead.id);
  const convert = useConvertLead();

  const closed = lead.status === 'CONVERTED' || lead.status === 'LOST';

  const setStatus = (status: Lead['status'], msg: string) =>
    update.mutate(
      { status },
      {
        onSuccess: () => toast.success(msg),
        onError: () => toast.error(t('common.errorShort')),
      },
    );

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing[2] },
      ]}
    >
      {closed ? (
        <Button title={t('leads.closed')} variant="secondary" disabled onPress={() => {}} />
      ) : (
        <View style={styles.col}>
          <View style={styles.row}>
            {lead.status === 'NEW' ? (
              <Button
                title={t('leads.takeToWork')}
                variant="secondary"
                style={styles.flexBtn}
                icon={<Play size={16} color={colors.text.primary} />}
                loading={update.isPending}
                onPress={() => setStatus('IN_PROGRESS', t('leads.tookToWork'))}
              />
            ) : (
              <Button
                title={t('leads.qualify')}
                variant="secondary"
                style={styles.flexBtn}
                icon={<CircleCheck size={16} color={colors.text.primary} />}
                loading={update.isPending}
                onPress={() => setStatus('QUALIFIED', t('leads.qualified'))}
              />
            )}
            <Button
              title={t('leads.convert')}
              style={styles.flexBtn}
              icon={<Briefcase size={16} color="#fff" />}
              loading={convert.isPending}
              onPress={() =>
                convert.mutate(lead.id, {
                  onSuccess: () => {
                    toast.success(t('leads.converted'));
                    router.back();
                  },
                  onError: () => toast.error(t('leads.convertFailed')),
                })
              }
            />
          </View>
          <Button
            title={t('leads.closeLost')}
            variant="ghost"
            icon={<X size={16} color={colors.status.danger} />}
            onPress={() => setStatus('LOST', t('leads.lost'))}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.raised,
  },
  col: { gap: spacing[1] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flexBtn: { flex: 1 },
});
