/** Сегмент «Лиды»: поиск + FlashList лидов (ТЗ §8.3). */
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EntityList, Input } from '@/components/ui';
import { useLeads } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { colors, spacing } from '@/theme';
import type { Lead } from '@/types';

import { LeadListItem } from './LeadListItem';

export function LeadsListView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);

  const { data, isLoading, isRefetching, error, refetch } = useLeads({
    search: debounced || undefined,
    take: 30,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('deals.searchLeads')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Lead>
        data={data?.items ?? []}
        keyExtractor={(l) => l.id}
        estimatedItemSize={76}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('deals.notFoundLeads')}
        renderItem={({ item }) => (
          <LeadListItem
            lead={item}
            onPress={() => router.push(`/(tabs)/deals/lead/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
});
