import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { LeadInput } from '@/api';
import { FormField, FormScreen, FormSelect } from '@/components/form';
import { useCreateLead, useUpdateLead } from '@/hooks/mutations';
import { useLead } from '@/hooks/queries';
import { toast } from '@/lib/toast';

const SOURCES = [
  { value: 'WEBSITE', label: 'Сайт' },
  { value: 'CALL', label: 'Звонок' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SOCIAL', label: 'Соцсети' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'REFERRAL', label: 'Реферал' },
  { value: 'OTHER', label: 'Другое' },
];

const schema = z.object({
  name: z.string().min(1, 'Укажите имя'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  company: z.string().optional(),
  source: z.string(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** Создание/редактирование лида (ТЗ §8.3, Фаза 3). */
export default function LeadFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const existing = useLead(id ?? '');
  const create = useCreateLead();
  const update = useUpdateLead(id ?? '');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      company: '',
      source: 'WEBSITE',
      description: '',
    },
  });

  useEffect(() => {
    if (isEdit && existing.data) {
      reset({
        name: existing.data.name,
        phone: existing.data.phone ?? '',
        email: existing.data.email ?? '',
        company: existing.data.company ?? '',
        source: existing.data.source,
        description: existing.data.description ?? '',
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: LeadInput = {
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      company: values.company || undefined,
      source: values.source as LeadInput['source'],
      description: values.description || undefined,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? 'Лид обновлён' : 'Лид создан');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    };
    if (isEdit) update.mutate(payload, opts);
    else create.mutate(payload, opts);
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать лид' : 'Новый лид'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать лид'}
      submitting={create.isPending || update.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="name" label="Имя" placeholder="ФИО лида" />
      <FormField
        control={control}
        name="phone"
        label="Телефон"
        keyboardType="phone-pad"
      />
      <FormField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField control={control} name="company" label="Компания" />
      <FormSelect control={control} name="source" label="Источник" options={SOURCES} />
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
