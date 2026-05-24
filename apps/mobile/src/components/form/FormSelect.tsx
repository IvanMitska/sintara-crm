/** Селект формы со статичными вариантами — открывает нижний лист. */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Check, ChevronDown } from 'lucide-react-native';
import { useRef } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Выберите…',
}: FormSelectProps<T>) {
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => {
        const selected = options.find((o) => o.value === value);
        return (
          <View style={styles.wrap}>
            <Text variant="subhead" weight="medium" tone="secondary" style={styles.label}>
              {label}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptics.select();
                sheetRef.current?.present();
              }}
              style={[styles.field, !!fieldState.error && styles.errored]}
            >
              <Text
                variant="body"
                tone={selected ? 'primary' : 'disabled'}
                style={styles.value}
              >
                {selected?.label ?? placeholder}
              </Text>
              <ChevronDown size={18} color={colors.text.muted} />
            </Pressable>
            {fieldState.error ? (
              <Text variant="caption" color={colors.status.danger}>
                {fieldState.error.message}
              </Text>
            ) : null}

            <Sheet ref={sheetRef}>
              <Text variant="headline" weight="semibold" style={styles.sheetTitle}>
                {label}
              </Text>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    onPress={() => {
                      haptics.select();
                      onChange(opt.value);
                      sheetRef.current?.dismiss();
                    }}
                    style={styles.option}
                  >
                    <Text variant="body" weight={active ? 'semibold' : 'regular'}>
                      {opt.label}
                    </Text>
                    {active ? (
                      <Check size={18} color={colors.brand.primary500} />
                    ) : null}
                  </Pressable>
                );
              })}
            </Sheet>
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
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  errored: { borderColor: colors.status.danger },
  value: { flex: 1 },
  sheetTitle: { marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
});
