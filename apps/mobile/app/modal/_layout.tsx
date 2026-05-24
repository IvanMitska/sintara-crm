import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
