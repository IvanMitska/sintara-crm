import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { companiesApi } from '@/api';
import {
  FormEntitySelect,
  FormField,
  FormScreen,
  FormSelect,
  type SelectOption,
} from '@/components/form';
import { useCreateContact, useUpdateContact } from '@/hooks/mutations';
import { useContact } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import type { Contact, ContactSource } from '@/types';

const SOURCES: SelectOption[] = [
  { value: 'WEBSITE', label: 'Сайт' },
  { value: 'PHONE', label: 'Телефон' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'REFERRAL', label: 'Реферал' },
  { value: 'DIRECT', label: 'Прямой' },
  { value: 'OTHER', label: 'Другое' },
];

const schema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  position: z.string().optional(),
  source: z.string(),
  description: z.string().optional(),
  company: z.custom<SelectOption>().optional(),
});
type FormValues = z.infer<typeof schema>;

const fetchCompanies = (q: string) =>
  companiesApi
    .list({ search: q || undefined, take: 10 })
    .then((r) => r.data.map((c) => ({ value: c.id, label: c.name })));

/** Создание/редактирование контакта (ТЗ §8.6, Фаза 3). */
export default function ContactFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const existing = useContact(id ?? '');
  const create = useCreateContact();
  const update = useUpdateContact(id ?? '');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      position: '',
      source: 'DIRECT',
      description: '',
    },
  });

  useEffect(() => {
    if (isEdit && existing.data) {
      const c = existing.data;
      reset({
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone ?? '',
        email: c.email ?? '',
        position: c.position ?? '',
        source: c.source,
        description: c.description ?? '',
        company: c.company ? { value: c.company.id, label: c.company.name } : undefined,
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: Partial<Contact> = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      email: values.email || null,
      position: values.position || null,
      source: values.source as ContactSource,
      description: values.description || null,
      companyId: values.company?.value ?? null,
    };
    const mutation = isEdit ? update : create;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? 'Контакт обновлён' : 'Контакт создан');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    });
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать контакт' : 'Новый контакт'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать контакт'}
      submitting={create.isPending || update.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="firstName" label="Имя" />
      <FormField control={control} name="lastName" label="Фамилия" />
      <FormField control={control} name="phone" label="Телефон" keyboardType="phone-pad" />
      <FormField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField control={control} name="position" label="Должность" />
      <FormEntitySelect
        control={control}
        name="company"
        label="Компания"
        fetchOptions={fetchCompanies}
      />
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
