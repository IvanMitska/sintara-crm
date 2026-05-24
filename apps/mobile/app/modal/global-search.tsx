import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { Card, Input, SectionHeader, Text } from '@/components/ui';
import { useGlobalSearch } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { colors, spacing } from '@/theme';

/** Глобальный поиск (ТЗ §7.4): 6 ресурсов параллельно. */
export default function GlobalSearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 200);

  const { data, isFetching } = useGlobalSearch(debounced);

  const go = (path: string) => {
    router.back();
    router.push(path as never);
  };

  const groups = data
    ? [
        {
          title: t('search.groupContacts'),
          items: data.contacts.map((c) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName}`,
            sub: c.company?.name ?? c.phone ?? '',
            path: `/(tabs)/more/contacts/${c.id}`,
          })),
        },
        {
          title: t('search.groupCompanies'),
          items: data.companies.map((c) => ({
            id: c.id,
            label: c.name,
            sub: c.industry ?? '',
            path: `/(tabs)/more/companies`,
          })),
        },
        {
          title: t('search.groupDeals'),
          items: data.deals.map((d) => ({
            id: d.id,
            label: d.title,
            sub: `${d.amount} ${d.currency}`,
            path: `/(tabs)/deals/${d.id}`,
          })),
        },
        {
          title: t('search.groupLeads'),
          items: data.leads.map((l) => ({
            id: l.id,
            label: l.name,
            sub: l.phone ?? '',
            path: `/(tabs)/deals/lead/${l.id}`,
          })),
        },
        {
          title: t('search.groupTasks'),
          items: data.tasks.map((tk) => ({
            id: tk.id,
            label: tk.title,
            sub: '',
            path: `/(tabs)/more/tasks/${tk.id}`,
          })),
        },
        {
          title: t('search.groupProducts'),
          items: data.products.map((p) => ({
            id: p.id,
            label: p.name,
            sub: `${p.price} ${p.currency}`,
            path: `/(tabs)/more/products`,
          })),
        },
      ].filter((g) => g.items.length > 0)
    : [];

  return (
    <CosmicBg>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.inputWrap}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t('common.search')}
            autoFocus
            leftIcon={<Search size={18} color={colors.text.muted} />}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Text variant="callout" weight="medium" color={colors.brand.primary500}>
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.results}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isFetching ? (
          <ActivityIndicator color={colors.brand.primary500} style={styles.loader} />
        ) : null}
        {debounced.length >= 2 && !isFetching && groups.length === 0 ? (
          <Text variant="callout" tone="muted" center style={styles.loader}>
            {t('common.notFound')}
          </Text>
        ) : null}
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionHeader title={group.title} count={group.items.length} />
            {group.items.map((item) => (
              <Card key={item.id} onPress={() => go(item.path)} style={styles.item}>
                <Text variant="callout" weight="medium" numberOfLines={1}>
                  {item.label}
                </Text>
                {item.sub ? (
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {item.sub}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  inputWrap: { flex: 1 },
  results: { padding: spacing[4], gap: spacing[4] },
  loader: { marginTop: spacing[8] },
  group: { gap: spacing[2] },
  item: { padding: spacing[3], gap: 2 },
});
