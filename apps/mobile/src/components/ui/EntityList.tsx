/**
 * Переиспользуемый список сущностей (ТЗ §15: FlashList для длинных списков).
 * Состояния loading/empty/error + pull-to-refresh + infinite scroll.
 */
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/layout/Screen';
import { colors, spacing } from '@/theme';

import { ScreenError, ScreenSkeleton } from './ScreenState';

interface EntityListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  estimatedItemSize: number;
  isLoading?: boolean;
  isRefetching?: boolean;
  error?: unknown;
  onRefresh?: () => void;
  onRetry?: () => void;
  onEndReached?: () => void;
  emptyText?: string;
  header?: React.ReactElement;
}

export function EntityList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  isLoading,
  isRefetching,
  error,
  onRefresh,
  onRetry,
  onEndReached,
  emptyText,
  header,
}: EntityListProps<T>) {
  const insets = useSafeAreaInsets();

  if (isLoading) return <ScreenSkeleton kind="list" />;
  if (error && data.length === 0) {
    return <ScreenError error={error} onRetry={onRetry} />;
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={{
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4],
      }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary500}
          />
        ) : undefined
      }
      ListEmptyComponent={
        !isLoading ? (
          <ScreenError kind="empty" message={emptyText} />
        ) : null
      }
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: { height: spacing[2] },
});
