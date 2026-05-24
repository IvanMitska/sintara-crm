/** Поле отправки сообщения в диалоге (ТЗ §8.5, Фаза 3). */
import { SendHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/layout';
import { useSendMessage } from '@/hooks/mutations';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { colors, radius, spacing, typography } from '@/theme';

interface MessageComposerProps {
  contactId: string;
  /** Канал отправки — берётся из последнего сообщения треда. */
  channel: string;
}

export function MessageComposer({ contactId, channel }: MessageComposerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const send = useSendMessage(contactId);

  const onSend = () => {
    const content = text.trim();
    if (!content) return;
    haptics.select();
    setText('');
    send.mutate(
      { contactId, channel, content },
      { onError: () => toast.error(t('inbox.sendFailed')) },
    );
  };

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing[2] },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('inbox.messagePlaceholder')}
        placeholderTextColor={colors.text.disabled}
        selectionColor={colors.brand.primary500}
        multiline
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.send')}
        disabled={!text.trim()}
        onPress={onSend}
        style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}
      >
        <SendHorizontal size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.raised,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.body.fontSize,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary600,
  },
  sendDisabled: { opacity: 0.4 },
});
