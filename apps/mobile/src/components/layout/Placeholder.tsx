/**
 * Заглушка раздела для Фазы 1 (каркас). Реальное наполнение приходит
 * в Фазах 2–3 по дорожной карте ТЗ §21.
 */
import { Construction, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

interface PlaceholderProps {
  /** Иконка раздела. */
  icon?: LucideIcon;
  /** Подпись — что здесь появится. */
  caption?: string;
}

export function Placeholder({ icon: Icon = Construction, caption }: PlaceholderProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={40} color={colors.brand.primary500} strokeWidth={1.5} />
      </View>
      <Text variant="headline" weight="semibold" center>
        {t('common.comingSoon')}
      </Text>
      {caption ? (
        <Text variant="callout" tone="muted" center style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
    marginBottom: spacing[2],
  },
  caption: { maxWidth: 280 },
});
