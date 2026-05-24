/** Сегмент «Сделки»: поиск + FlashList сделок (ТЗ §8.3). */
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EntityList, Input } from '@/components/ui';
import { useDeals } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { colors, spacing } from '@/theme';
import type { Deal } from '@/types';

import { DealListItem } from './DealListItem';

export function DealsListView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);

  const { data, isLoading, isRefetching, error, refetch } = useDeals({
    search: debounced || undefined,
    take: 30,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('deals.searchDeals')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Deal>
        data={data?.data ?? []}
        keyExtractor={(d) => d.id}
        estimatedItemSize={120}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('deals.notFoundDeals')}
        renderItem={({ item }) => (
          <DealListItem
            deal={item}
            onPress={() => router.push(`/(tabs)/deals/${item.id}`)}
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
