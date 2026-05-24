import { router, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { LeadActionsBar } from '@/components/leads/LeadActionsBar';
import { Avatar, Badge, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useLead } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { colors, leadStatusColor, spacing } from '@/theme';

export default function LeadDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading, error, refetch } = useLead(id);

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title={t('leads.title')} />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !lead) {
    return (
      <CosmicBg>
        <StackHeader title={t('leads.title')} />
        <ScreenError error={error} kind={lead ? 'error' : 'not-found'} onRetry={refetch} />
      </CosmicBg>
    );
  }

  return (
    <CosmicBg>
      <StackHeader
        title={lead.name}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
            hitSlop={10}
            onPress={() => router.push(`/(tabs)/deals/lead/new?id=${lead.id}` as never)}
          >
            <Pencil size={20} color={colors.text.secondary} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar firstName={lead.name} size={64} />
          <Text variant="title" weight="bold" center>
            {lead.name}
          </Text>
          <Badge
            label={t(`status.lead${lead.status}`)}
            color={leadStatusColor[lead.status] ?? '#888'}
          />
        </View>

        <GlassCard style={styles.card}>
          <InfoRow
            label={t('auth.email')}
            value={lead.email}
            onPress={
              lead.email ? () => Linking.openURL(`mailto:${lead.email}`) : undefined
            }
          />
          <InfoRow
            label={t('common.phone')}
            value={lead.phone}
            onPress={lead.phone ? () => Linking.openURL(`tel:${lead.phone}`) : undefined}
          />
          <InfoRow label={t('leads.company')} value={lead.company} />
          <InfoRow label={t('leads.source')} value={t(`status.source${lead.source}`)} />
          <InfoRow label={t('deals.description')} value={lead.description} />
          <InfoRow label={t('leads.createdAt')} value={formatDate(lead.createdAt)} />
          {lead.convertedAt ? (
            <InfoRow
              label={t('leads.convertedAt')}
              value={formatDate(lead.convertedAt)}
            />
          ) : null}
        </GlassCard>
      </ScrollView>
      <LeadActionsBar lead={lead} />
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  header: { alignItems: 'center', gap: spacing[2] },
  card: { padding: spacing[4] },
});
