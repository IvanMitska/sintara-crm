/** Текстовое поле формы на react-hook-form + наш Input. */
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui';

interface FormFieldProps<T extends FieldValues> extends Omit<InputProps, 'value'> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <Input
          label={label}
          value={value != null ? String(value) : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
