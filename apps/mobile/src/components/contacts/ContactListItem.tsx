/** Строка контакта: аватар, имя, компания/телефон. */
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, Text } from '@/components/ui';
import type { Contact } from '@/types';

export function ContactListItem({
  contact,
  onPress,
}: {
  contact: Contact;
  onPress?: () => void;
}) {
  const subtitle =
    contact.company?.name ?? contact.position ?? contact.phone ?? contact.email ?? '';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          size={40}
        />
        <View style={styles.body}>
          <Text variant="callout" weight="semibold" numberOfLines={1}>
            {contact.firstName} {contact.lastName}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 2 },
});
