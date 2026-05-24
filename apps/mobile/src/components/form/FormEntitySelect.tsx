/**
 * Селект-автокомплит формы: поиск сущности (контакт/компания/сделка) в листе.
 * fetchOptions вызывается с debounce при вводе.
 */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Input, Sheet, Text } from '@/components/ui';
import { useDebounced } from '@/hooks/useDebounced';
import { haptics } from '@/lib/haptics';
import { colors, radius } from '@/theme';

import type { SelectOption } from './FormSelect';

interface FormEntitySelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** Поиск опций по строке запроса. */
  fetchOptions: (query: string) => Promise<SelectOption[]>;
  placeholder?: string;
}

export function FormEntitySelect<T extends FieldValues>({
  control,
  name,
  label,
  fetchOptions,
  placeholder = 'Не выбрано',
}: FormEntitySelectProps<T>) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(query, 300);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOptions(debounced)
      .then((opts) => {
        if (!cancelled) setOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, fetchOptions]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        // value хранит { id, label } либо undefined.
        const current = value as SelectOption | undefined;
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
              style={styles.field}
            >
              <Text
                variant="body"
                tone={current ? 'primary' : 'disabled'}
                style={styles.value}
              >
                {current?.label ?? placeholder}
              </Text>
              {current ? (
                <Pressable hitSlop={8} onPress={() => onChange(undefined)}>
                  <X size={16} color={colors.text.muted} />
                </Pressable>
              ) : (
                <ChevronDown size={18} color={colors.text.muted} />
              )}
            </Pressable>

            <Sheet ref={sheetRef} snapPoints={['70%']}>
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Поиск…"
                autoFocus
                leftIcon={<Search size={18} color={colors.text.muted} />}
              />
              <View style={styles.results}>
                {loading ? (
                  <ActivityIndicator color={colors.brand.primary500} />
                ) : options.length === 0 ? (
                  <Text variant="callout" tone="muted" center>
                    Ничего не найдено
                  </Text>
                ) : (
                  options.map((opt) => (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      onPress={() => {
                        haptics.select();
                        onChange(opt);
                        sheetRef.current?.dismiss();
                      }}
                      style={styles.option}
                    >
                      <Text variant="body">{opt.label}</Text>
                    </Pressable>
                  ))
                )}
              </View>
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
  value: { flex: 1 },
  results: { marginTop: 12, gap: 2 },
  option: {
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
});
