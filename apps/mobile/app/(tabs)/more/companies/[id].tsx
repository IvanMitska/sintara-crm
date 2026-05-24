import { useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useCompany } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { spacing } from '@/theme';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: company, isLoading, error, refetch } = useCompany(id);

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Компания" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !company) {
    return (
      <CosmicBg>
        <StackHeader title="Компания" />
        <ScreenError
          error={error}
          kind={company ? 'error' : 'not-found'}
          onRetry={refetch}
        />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader title={company.name} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title" weight="bold">
          {company.name}
        </Text>
        <GlassCard style={styles.card}>
          <InfoRow
            label="Телефон"
            value={company.phone}
            onPress={
              company.phone ? () => Linking.openURL(`tel:${company.phone}`) : undefined
            }
          />
          <InfoRow
            label="Email"
            value={company.email}
            onPress={
              company.email
                ? () => Linking.openURL(`mailto:${company.email}`)
                : undefined
            }
          />
          <InfoRow
            label="Сайт"
            value={company.website}
            onPress={
              company.website
                ? () => Linking.openURL(company.website!)
                : undefined
            }
          />
          <InfoRow label="Отрасль" value={company.industry} />
          <InfoRow label="Адрес" value={company.address} />
          <InfoRow label="ИНН" value={company.inn} />
          <InfoRow label="Описание" value={company.description} />
          <InfoRow label="Создана" value={formatDate(company.createdAt)} />
        </GlassCard>
      </ScrollView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  card: { padding: spacing[4] },
});
