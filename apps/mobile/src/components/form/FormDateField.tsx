/** Поле выбора даты формы (нативный DateTimePicker). */
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

interface FormDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  mode?: 'date' | 'datetime';
}

export function FormDateField<T extends FieldValues>({
  control,
  name,
  label,
  mode = 'date',
}: FormDateFieldProps<T>) {
  const [show, setShow] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const date = value ? new Date(value as string) : undefined;
        return (
          <View style={styles.wrap}>
            <Text variant="subhead" weight="medium" tone="secondary" style={styles.label}>
              {label}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptics.select();
                setShow(true);
              }}
              style={styles.field}
            >
              <CalendarDays size={18} color={colors.text.muted} />
              <Text
                variant="body"
                tone={date ? 'primary' : 'disabled'}
                style={styles.value}
              >
                {date ? formatDate(date) : 'Не выбрано'}
              </Text>
              {date ? (
                <Pressable hitSlop={8} onPress={() => onChange(undefined)}>
                  <X size={16} color={colors.text.muted} />
                </Pressable>
              ) : null}
            </Pressable>

            {show ? (
              <DateTimePicker
                value={date ?? new Date()}
                mode={mode === 'datetime' ? 'datetime' : 'date'}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                onChange={(event, selected) => {
                  if (Platform.OS === 'android') setShow(false);
                  if (event.type === 'set' && selected) {
                    onChange(selected.toISOString());
                  }
                }}
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  value: { flex: 1 },
});
