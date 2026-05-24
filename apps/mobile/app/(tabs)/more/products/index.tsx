import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Card, EntityList, Input, Text } from '@/components/ui';
import { useProducts } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { formatCurrency } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { Currency, Product } from '@/types';

/** Каталог товаров (ТЗ §8.9). */
export default function ProductsScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 250);

  const { data, isLoading, isRefetching, error, refetch } = useProducts({
    search: debounced || undefined,
    take: 40,
  });

  return (
    <CosmicBg>
      <StackHeader title={t('more.products')} />
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Product>
        data={data?.data ?? []}
        keyExtractor={(p) => p.id}
        estimatedItemSize={64}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('common.notFound')}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.body}>
                <Text variant="callout" weight="semibold" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.sku ? (
                  <Text variant="caption" tone="muted">
                    Артикул: {item.sku}
                  </Text>
                ) : null}
              </View>
              <Text variant="callout" weight="bold" color={colors.brand.accent500}>
                {formatCurrency(Number(item.price), item.currency as Currency)}
              </Text>
            </View>
          </Card>
        )}
      />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
});
