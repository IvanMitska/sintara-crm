/**
 * Экранные состояния loading / empty / error (ТЗ §8: формат каждого экрана).
 * ScreenSkeleton — по форме контента; ScreenError — с retry.
 */
import { CircleAlert, Inbox, SearchX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/client';
import { colors, spacing } from '@/theme';

import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

type SkeletonKind = 'list' | 'detail' | 'today';

export function ScreenSkeleton({ kind = 'list' }: { kind?: SkeletonKind }) {
  return (
    <View style={styles.container}>
      {kind === 'detail' ? (
        <>
          <Skeleton height={28} width="70%" />
          <Skeleton height={16} width="40%" />
          <Skeleton height={120} rounded="lg" />
          <Skeleton height={56} rounded="md" />
          <Skeleton height={56} rounded="md" />
        </>
      ) : (
        Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.row}>
            <Skeleton height={44} width={44} rounded="md" />
            <View style={styles.rowText}>
              <Skeleton height={15} width="60%" />
              <Skeleton height={12} width="35%" />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

interface ScreenErrorProps {
  error?: unknown;
  kind?: 'error' | 'not-found' | 'empty';
  message?: string;
  onRetry?: () => void;
}

export function ScreenError({ error, kind = 'error', message, onRetry }: ScreenErrorProps) {
  const { t } = useTranslation();
  const normalized = error ? normalizeError(error) : null;

  const Icon = kind === 'not-found' ? SearchX : kind === 'empty' ? Inbox : CircleAlert;
  const title =
    message ??
    (kind === 'not-found'
      ? t('common.notFound')
      : kind === 'empty'
        ? t('common.notFound')
        : (normalized?.message ?? t('common.error')));

  return (
    <View style={styles.center}>
      <Icon size={48} color={colors.text.muted} strokeWidth={1.5} />
      <Text variant="body" tone="secondary" center style={styles.errorText}>
        {title}
      </Text>
      {onRetry && kind === 'error' ? (
        <Button title={t('common.retry')} variant="secondary" fullWidth={false} onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing[4], gap: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  rowText: { flex: 1, gap: 8 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  errorText: { maxWidth: 280 },
});
