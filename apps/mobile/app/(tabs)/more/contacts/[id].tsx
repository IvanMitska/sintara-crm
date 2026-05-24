import { useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg, GlassCard } from '@/components/glass';
import { StackHeader, TAB_BAR_HEIGHT } from '@/components/layout';
import { Avatar, ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { InfoRow } from '@/components/ui/InfoRow';
import { useContact, useContactStats } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { colors, spacing } from '@/theme';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: contact, isLoading, error, refetch } = useContact(id);
  const stats = useContactStats(id);

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title="Контакт" />
        <ScreenSkeleton kind="detail" />
      </CosmicBg>
    );
  }
  if (error || !contact) {
    return (
      <CosmicBg>
        <StackHeader title="Контакт" />
        <ScreenError
          error={error}
          kind={contact ? 'error' : 'not-found'}
          onRetry={refetch}
        />
      </CosmicBg>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <CosmicBg>
      <StackHeader title={fullName} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Avatar firstName={contact.firstName} lastName={contact.lastName} size={64} />
          <Text variant="title" weight="bold" center>
            {fullName}
          </Text>
          {contact.position ? (
            <Text variant="callout" tone="muted">
              {contact.position}
            </Text>
          ) : null}
        </View>

        {stats.data ? (
          <View style={styles.statsRow}>
            <Stat value={stats.data.dealsCount} label="Сделок" />
            <Stat value={stats.data.tasksCount} label="Задач" />
            <Stat value={stats.data.activitiesCount} label="Активностей" />
          </View>
        ) : null}

        <GlassCard style={styles.card}>
          <InfoRow
            label="Телефон"
            value={contact.phone}
            onPress={
              contact.phone ? () => Linking.openURL(`tel:${contact.phone}`) : undefined
            }
          />
          <InfoRow
            label="Email"
            value={contact.email}
            onPress={
              contact.email
                ? () => Linking.openURL(`mailto:${contact.email}`)
                : undefined
            }
          />
          <InfoRow label="Компания" value={contact.company?.name} />
          <InfoRow label="Источник" value={contact.source} />
          <InfoRow label="Описание" value={contact.description} />
          <InfoRow label="Создан" value={formatDate(contact.createdAt)} />
        </GlassCard>
      </ScrollView>
    </CosmicBg>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <GlassCard style={styles.stat}>
      <Text variant="headline" weight="bold" color={colors.brand.primary500}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  header: { alignItems: 'center', gap: spacing[1] },
  statsRow: { flexDirection: 'row', gap: spacing[2] },
  stat: { flex: 1, alignItems: 'center', padding: spacing[3], gap: 2 },
  card: { padding: spacing[4] },
});
