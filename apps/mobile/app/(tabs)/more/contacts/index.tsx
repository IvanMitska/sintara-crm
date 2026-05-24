import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { CopyCheck, Database, Plus, Search } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ContactListItem } from '@/components/contacts/ContactListItem';
import { ContactsDataSheet } from '@/components/contacts/ContactsDataSheet';
import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Card, EntityList, Input, Text } from '@/components/ui';
import { useContacts } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import type { Contact } from '@/types';

/** Контакты (ТЗ §8.6): список, поиск, дубли, импорт/экспорт, создание. */
export default function ContactsScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 250);
  const dataSheet = useRef<BottomSheetModal>(null);

  const { data, isLoading, isRefetching, error, refetch } = useContacts({
    search: debounced || undefined,
    take: 40,
    sortBy: 'firstName',
    sortOrder: 'asc',
  });

  return (
    <CosmicBg>
      <StackHeader
        title={t('more.contacts')}
        right={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Импорт и экспорт"
              hitSlop={10}
              onPress={() => {
                haptics.select();
                dataSheet.current?.present();
              }}
            >
              <Database size={20} color={colors.text.secondary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Новый контакт"
              hitSlop={10}
              onPress={() => router.push('/(tabs)/more/contacts/new')}
            >
              <Plus size={22} color={colors.brand.primary500} />
            </Pressable>
          </View>
        }
      />
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Contact>
        data={data?.data ?? []}
        keyExtractor={(c) => c.id}
        estimatedItemSize={68}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('common.notFound')}
        header={
          <Card
            onPress={() => router.push('/(tabs)/more/contacts/duplicates')}
            style={styles.dupRow}
          >
            <CopyCheck size={18} color={colors.brand.primary500} />
            <Text variant="callout" weight="medium">
              Найти дубликаты
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <ContactListItem
            contact={item}
            onPress={() => router.push(`/(tabs)/more/contacts/${item.id}`)}
          />
        )}
      />
      <ContactsDataSheet ref={dataSheet} />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  searchBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  dupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    marginBottom: spacing[2],
  },
});
