/** Каркас экрана-формы: фон + шапка + клавиатура + sticky-кнопка сохранения. */
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { StackHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

interface FormScreenProps {
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;
  submitDisabled?: boolean;
  children: React.ReactNode;
}

export function FormScreen({
  title,
  submitLabel,
  onSubmit,
  submitting,
  submitDisabled,
  children,
}: FormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <CosmicBg>
      <StackHeader title={title} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing[3] },
          ]}
        >
          <Button
            title={submitLabel}
            loading={submitting}
            disabled={submitDisabled}
            onPress={onSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing[4],
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.raised,
  },
});
