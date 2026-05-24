/** Лист управления данными контактов (ТЗ §8.6): импорт/экспорт. */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, Smartphone, type LucideIcon } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import type { ImportResult } from '@/api';
import { Sheet, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import {
  countPhoneContacts,
  exportContacts,
  importContactsFromFile,
  importContactsFromPhone,
} from '@/lib/import-export';
import { qk } from '@/lib/query';
import { toast } from '@/lib/toast';
import { colors, spacing } from '@/theme';

export const ContactsDataSheet = forwardRef<BottomSheetModal>(
  function ContactsDataSheet(_props, ref) {
    const qc = useQueryClient();
    const [busy, setBusy] = useState(false);

    const afterImport = (result: ImportResult | null) => {
      if (!result) return;
      void qc.invalidateQueries({ queryKey: qk.contacts.all });
      toast.success(
        `Импортировано: ${result.success}`,
        result.failed || result.duplicates
          ? `Пропущено: ${result.failed}, дубли: ${result.duplicates}`
          : undefined,
      );
    };

    const run = async (fn: () => Promise<void>) => {
      setBusy(true);
      try {
        await fn();
      } catch {
        toast.error('Операция не удалась');
      } finally {
        setBusy(false);
      }
    };

    const onPhone = () =>
      run(async () => {
        const count = await countPhoneContacts();
        if (count === null) {
          toast.error('Нет доступа к контактам телефона');
          return;
        }
        if (count === 0) {
          toast.info('В телефоне нет контактов');
          return;
        }
        Alert.alert(
          'Импорт из телефона',
          `Импортировать ${count} контактов?`,
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Импортировать',
              onPress: () =>
                void run(async () => afterImport(await importContactsFromPhone())),
            },
          ],
        );
      });

    const onFile = () =>
      run(async () => afterImport(await importContactsFromFile()));

    const onExport = () =>
      run(async () => {
        const ok = await exportContacts();
        if (!ok) toast.error('Шаринг недоступен');
      });

    return (
      <Sheet ref={ref}>
        <Text variant="headline" weight="semibold" style={styles.title}>
          Данные контактов
        </Text>
        {busy ? (
          <ActivityIndicator color={colors.brand.primary500} style={styles.loader} />
        ) : null}
        <Row icon={Smartphone} label="Импорт из телефона" onPress={onPhone} disabled={busy} />
        <Row icon={FileUp} label="Импорт из файла (CSV/XLSX)" onPress={onFile} disabled={busy} />
        <Row icon={Download} label="Экспортировать в файл" onPress={onExport} disabled={busy} />
      </Sheet>
    );
  },
);

function Row({
  icon: Icon,
  label,
  onPress,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={styles.iconWrap}>
        <Icon size={20} color={colors.brand.primary500} />
      </View>
      <Text variant="body" weight="medium">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing[2] },
  loader: { marginVertical: spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  disabled: { opacity: 0.5 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
});
