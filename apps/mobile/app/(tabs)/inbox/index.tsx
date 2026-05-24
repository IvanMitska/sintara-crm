import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ConversationListItem } from '@/components/inbox/ConversationListItem';
import { Screen } from '@/components/layout';
import { EntityList, Input } from '@/components/ui';
import { useConversations } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { colors, spacing } from '@/theme';
import type { Conversation } from '@/types';

/** Tab «Инбокс» (ТЗ §8.5): омниканальный список диалогов по контактам. */
export default function InboxScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);

  const { data, isLoading, isRefetching, error, refetch } = useConversations({
    search: debounced || undefined,
    take: 40,
  });

  return (
    <Screen title={t('tabs.inbox')}>
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('inbox.searchDialogs')}
          leftIcon={<Search size={18} color={colors.text.muted} />}
        />
      </View>
      <EntityList<Conversation>
        data={data?.data ?? []}
        keyExtractor={(c) => c.contactId}
        estimatedItemSize={84}
        isLoading={isLoading}
        isRefetching={isRefetching}
        error={error}
        onRefresh={refetch}
        onRetry={refetch}
        emptyText={t('inbox.noDialogs')}
        renderItem={({ item }) => (
          <ConversationListItem
            conversation={item}
            onPress={() => router.push(`/(tabs)/inbox/${item.contactId}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
});
