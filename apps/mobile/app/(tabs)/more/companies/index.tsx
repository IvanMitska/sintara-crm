import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CompanyListItem } from '@/components/companies/CompanyListItem';
import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { EntityList, Input } from '@/components/ui';
import { useCompanies } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { colors, spacing } from '@/theme';
import type { Company } from '@/types';

/** Компании (ТЗ §8.7): список + поиск. */
export default function CompaniesScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 250);

  const { data, isLoading, isRefetching, error, refetch } = useCompanies({
    search: debounced || undefined,
    take: 40,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  return (
    <CosmicBg>
      <StackHeader title={t('more.companies')} />
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Company>
        data={data?.data ?? []}
        keyExtractor={(c) => c.id}
        estimatedItemSize={68}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('common.notFound')}
        renderItem={({ item }) => (
          <CompanyListItem
            company={item}
            onPress={() => router.push(`/(tabs)/more/companies/${item.id}`)}
          />
        )}
      />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
});
