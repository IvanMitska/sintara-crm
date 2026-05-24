import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField, FormScreen } from '@/components/form';
import { useCreateCompany, useUpdateCompany } from '@/hooks/mutations';
import { useCompany } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import type { Company } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Укажите название'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  website: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  inn: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** Создание/редактирование компании (ТЗ §8.7, Фаза 3). */
export default function CompanyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const existing = useCompany(id ?? '');
  const create = useCreateCompany();
  const update = useUpdateCompany(id ?? '');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      website: '',
      industry: '',
      address: '',
      inn: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isEdit && existing.data) {
      const c = existing.data;
      reset({
        name: c.name,
        phone: c.phone ?? '',
        email: c.email ?? '',
        website: c.website ?? '',
        industry: c.industry ?? '',
        address: c.address ?? '',
        inn: c.inn ?? '',
        description: c.description ?? '',
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: Partial<Company> = {
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      website: values.website || null,
      industry: values.industry || null,
      address: values.address || null,
      inn: values.inn || null,
      description: values.description || null,
    };
    const mutation = isEdit ? update : create;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? 'Компания обновлена' : 'Компания создана');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    });
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать компанию' : 'Новая компания'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать компанию'}
      submitting={create.isPending || update.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="name" label="Название" />
      <FormField control={control} name="phone" label="Телефон" keyboardType="phone-pad" />
      <FormField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField control={control} name="website" label="Сайт" autoCapitalize="none" />
      <FormField control={control} name="industry" label="Отрасль" />
      <FormField control={control} name="address" label="Адрес" />
      <FormField control={control} name="inn" label="ИНН" keyboardType="number-pad" />
      <FormField
        control={control}
        name="description"
        label="Описание"
        multiline
        numberOfLines={4}
      />
    </FormScreen>
  );
}
