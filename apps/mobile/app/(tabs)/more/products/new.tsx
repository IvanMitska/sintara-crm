import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { ProductInput } from '@/api';
import { FormField, FormScreen, FormSelect, FormSwitch } from '@/components/form';
import { useCreateProduct, useUpdateProduct } from '@/hooks/mutations';
import { useProductDetail } from '@/hooks/queries';
import { toast } from '@/lib/toast';

const CURRENCIES = [
  { value: 'THB', label: 'THB' },
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const schema = z.object({
  name: z.string().min(1, 'Укажите название'),
  sku: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d+)?$/, 'Некорректная цена'),
  currency: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

/** Создание/редактирование товара (ТЗ §8.9, Фаза 3). */
export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const existing = useProductDetail(id ?? '');
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      price: '',
      currency: 'THB',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEdit && existing.data) {
      const p = existing.data;
      reset({
        name: p.name,
        sku: p.sku ?? '',
        price: String(p.price),
        currency: p.currency,
        description: p.description ?? '',
        isActive: p.isActive,
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: ProductInput = {
      name: values.name,
      sku: values.sku || undefined,
      price: Number(values.price),
      currency: values.currency,
      description: values.description || undefined,
      isActive: values.isActive,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? 'Товар обновлён' : 'Товар создан');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    };
    if (isEdit) update.mutate(payload, opts);
    else create.mutate(payload, opts);
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать товар' : 'Новый товар'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать товар'}
      submitting={create.isPending || update.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="name" label="Название" />
      <FormField control={control} name="sku" label="Артикул" />
      <FormField
        control={control}
        name="price"
        label="Цена"
        keyboardType="decimal-pad"
      />
      <FormSelect
        control={control}
        name="currency"
        label="Валюта"
        options={CURRENCIES}
      />
      <FormField
        control={control}
        name="description"
        label="Описание"
        multiline
        numberOfLines={3}
      />
      <FormSwitch control={control} name="isActive" label="Активен" />
    </FormScreen>
  );
}
