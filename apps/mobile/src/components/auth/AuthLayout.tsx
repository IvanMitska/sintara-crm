/** Общий каркас экранов авторизации: космический фон + логотип + клавиатура. */
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { Text } from '@/components/ui';
import { gradients, spacing } from '@/theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <CosmicBg>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[6] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Text variant="title" weight="bold" color="#fff">
                S
              </Text>
            </LinearGradient>
            <Text variant="title" weight="bold" center>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="callout" tone="secondary" center style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  header: { alignItems: 'center', gap: spacing[2] },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  subtitle: { maxWidth: 300 },
});
