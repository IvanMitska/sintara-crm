/** Аватар: фото или инициалы на градиенте. Поддержка онлайн-индикатора. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors, gradients } from '@/theme';

import { Text } from './Text';

export interface AvatarProps {
  uri?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
  online?: boolean;
}

export function Avatar({ uri, firstName, lastName, size = 40, online }: AvatarProps) {
  const radius = size / 2;
  const fontSize = Math.max(11, size * 0.38);

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <LinearGradient
          colors={gradients.purple}
          style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}
        >
          <Text weight="semibold" color="#fff" style={{ fontSize }}>
            {initials(firstName, lastName)}
          </Text>
        </LinearGradient>
      )}
      {online !== undefined ? (
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: online ? colors.status.success : colors.text.disabled,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.bg.base,
  },
});
