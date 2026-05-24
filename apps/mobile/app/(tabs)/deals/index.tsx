import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { DealsListView } from '@/components/deals/DealsListView';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { Screen } from '@/components/layout';
import { LeadsListView } from '@/components/leads/LeadsListView';
import { Segmented } from '@/components/ui';
import { spacing } from '@/theme';

type Segment = 'deals' | 'leads' | 'pipeline';

/** Tab «Сделки» (ТЗ §8.3): сегменты Сделки · Лиды · Воронка. */
export default function DealsScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('deals');

  return (
    <Screen title={t('tabs.deals')}>
      <View style={styles.segmentBar}>
        <Segmented<Segment>
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'deals', label: t('deals.segmentDeals') },
            { value: 'leads', label: t('deals.segmentLeads') },
            { value: 'pipeline', label: t('deals.segmentPipeline') },
          ]}
        />
      </View>
      {segment === 'deals' ? (
        <DealsListView />
      ) : segment === 'leads' ? (
        <LeadsListView />
      ) : (
        <KanbanBoard />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
});
