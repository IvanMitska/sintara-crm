/** Шапка для экранов внутри stack: кнопка «назад» + заголовок + слот действия. */
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { OfflineBanner } from './OfflineBanner';

interface StackHeaderProps {
  title: string;
  /** Действие справа (иконка/кнопка). */
  right?: React.ReactNode;
}

export function StackHeader({ title, right }: StackHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronLeft size={26} color={colors.text.primary} />
        </Pressable>
        <Text
          variant="headline"
          weight="semibold"
          numberOfLines={1}
          style={styles.title}
        >
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
      <OfflineBanner />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  back: { width: 32, alignItems: 'flex-start' },
  title: { flex: 1 },
  right: { minWidth: 32, alignItems: 'flex-end' },
});
