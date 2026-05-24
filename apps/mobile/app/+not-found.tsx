import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CosmicBg } from '@/components/glass';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  return (
    <CosmicBg>
      <Stack.Screen options={{ title: 'Не найдено' }} />
      <View style={styles.container}>
        <Text variant="display" weight="bold">
          404
        </Text>
        <Text variant="body" tone="secondary" center>
          Экран не найден
        </Text>
        <Link href="/(tabs)">
          <Text variant="callout" weight="semibold" color={colors.brand.primary500}>
            На главную
          </Text>
        </Link>
      </View>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
});
