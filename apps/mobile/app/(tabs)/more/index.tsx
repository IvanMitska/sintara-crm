import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreHub, Screen, TAB_BAR_HEIGHT } from '@/components/layout';
import { spacing } from '@/theme';

/** Хаб «Ещё» (ТЗ §7.2). */
export default function MoreScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Screen title={t('more.title')}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MoreHub />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing[2] },
});
