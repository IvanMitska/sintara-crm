import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CosmicBg } from '@/components/glass';
import { MessageBubble } from '@/components/inbox/MessageBubble';
import { MessageComposer } from '@/components/inbox/MessageComposer';
import { StackHeader } from '@/components/layout';
import { ScreenError, ScreenSkeleton, Text } from '@/components/ui';
import { useConversationThread, useMarkThreadRead } from '@/hooks/queries';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { qk } from '@/lib/query';
import { spacing } from '@/theme';

/** Диалог с контактом (ТЗ §8.5): чтение треда + отправка сообщений. */
export default function ConversationScreen() {
  const { t } = useTranslation();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading, error, refetch } = useConversationThread(contactId);
  const markRead = useMarkThreadRead();

  useSocketRoom('chat', contactId, {
    invalidateOn: { 'message:new': qk.inbox.thread(contactId) },
  });

  useEffect(() => {
    if (data && data.unreadCount > 0) {
      markRead.mutate(contactId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.contact.id]);

  const contactName = data
    ? `${data.contact.firstName} ${data.contact.lastName}`
    : t('inbox.dialog');

  if (isLoading) {
    return (
      <CosmicBg>
        <StackHeader title={t('inbox.dialog')} />
        <ScreenSkeleton kind="list" />
      </CosmicBg>
    );
  }
  if (error || !data) {
    return (
      <CosmicBg>
        <StackHeader title={t('inbox.dialog')} />
        <ScreenError error={error} kind={data ? 'error' : 'not-found'} onRetry={refetch} />
      </CosmicBg>
    );
  }

  const lastChannel =
    data.messages[data.messages.length - 1]?.channel ?? 'internal';

  return (
    <CosmicBg>
      <StackHeader title={contactName} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {data.messages.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="callout" tone="muted">
              {t('inbox.noMessages')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={data.messages}
            renderItem={({ item }) => <MessageBubble message={item} />}
            keyExtractor={(m) => m.id}
            estimatedItemSize={72}
            contentContainerStyle={{ paddingVertical: spacing[3] }}
            showsVerticalScrollIndicator={false}
          />
        )}
        <MessageComposer contactId={contactId} channel={lastChannel} />
      </KeyboardAvoidingView>
    </CosmicBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
