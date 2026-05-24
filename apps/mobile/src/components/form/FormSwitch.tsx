/** Переключатель формы (toggle «Повторять», «Активен»). */
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

interface FormSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  hint,
}: FormSwitchProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View style={styles.row}>
          <View style={styles.body}>
            <Text variant="body" weight="medium">
              {label}
            </Text>
            {hint ? (
              <Text variant="caption" tone="muted">
                {hint}
              </Text>
            ) : null}
          </View>
          <Switch
            value={!!value}
            onValueChange={onChange}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary600 }}
            thumbColor="#fff"
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  body: { flex: 1, gap: 2 },
});
