import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { contactsApi, companiesApi, type DealInput } from '@/api';
import {
  FormDateField,
  FormEntitySelect,
  FormField,
  FormScreen,
  FormSelect,
  type SelectOption,
} from '@/components/form';
import { useCreateDeal, useUpdateDeal } from '@/hooks/mutations';
import { useDeal, usePipelines } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import type { DealPriority, DealTemperature } from '@/types';

const CURRENCIES: SelectOption[] = [
  { value: 'THB', label: 'THB' },
  { value: 'RUB', label: 'RUB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const PRIORITIES: SelectOption[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
];

const TEMPERATURES: SelectOption[] = [
  { value: 'HOT', label: '🔥 Горячая' },
  { value: 'WARM', label: '🌡 Тёплая' },
  { value: 'COLD', label: '❄️ Холодная' },
];

const schema = z.object({
  title: z.string().min(1, 'Укажите название'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Некорректная сумма'),
  currency: z.string(),
  stageId: z.string().optional(),
  priority: z.string(),
  temperature: z.string().optional(),
  expectedDate: z.string().optional(),
  contact: z.custom<SelectOption>().optional(),
  company: z.custom<SelectOption>().optional(),
});
type FormValues = z.infer<typeof schema>;

const fetchContacts = (q: string) =>
  contactsApi
    .list({ search: q || undefined, take: 10 })
    .then((r) =>
      r.data.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
    );

const fetchCompanies = (q: string) =>
  companiesApi
    .list({ search: q || undefined, take: 10 })
    .then((r) => r.data.map((c) => ({ value: c.id, label: c.name })));

/** Создание/редактирование сделки (ТЗ §8.3, Фаза 3). */
export default function DealFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const pipelines = usePipelines();
  const existing = useDeal(id ?? '');
  const create = useCreateDeal();
  const update = useUpdateDeal(id ?? '');

  // Этапы воронки по умолчанию → опции селекта.
  const stageOptions: SelectOption[] = useMemo(() => {
    const def =
      pipelines.data?.find((p) => p.isDefault) ?? pipelines.data?.[0];
    return (def?.stages ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ value: s.id, label: s.name }));
  }, [pipelines.data]);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      amount: '',
      currency: 'THB',
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    if (isEdit && existing.data) {
      const d = existing.data;
      reset({
        title: d.title,
        amount: String(d.amount),
        currency: d.currency,
        stageId: d.stageId,
        priority: d.priority,
        temperature: d.temperature ?? undefined,
        expectedDate: d.expectedDate ?? undefined,
        contact: d.contact
          ? { value: d.contact.id, label: `${d.contact.firstName} ${d.contact.lastName}` }
          : undefined,
        company: d.company ? { value: d.company.id, label: d.company.name } : undefined,
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: DealInput = {
      title: values.title,
      amount: Number(values.amount),
      currency: values.currency,
      stageId: values.stageId || stageOptions[0]?.value || '',
      priority: values.priority as DealPriority,
      temperature: values.temperature as DealTemperature | undefined,
      expectedDate: values.expectedDate,
      contactId: values.contact?.value,
      companyId: values.company?.value,
    };
    const opts = {
      onSuccess: () => {
        toast.success(isEdit ? 'Сделка обновлена' : 'Сделка создана');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    };
    if (isEdit) update.mutate(payload, opts);
    else create.mutate(payload, opts);
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать сделку' : 'Новая сделка'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать сделку'}
      submitting={create.isPending || update.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="title" label="Название" />
      <FormField
        control={control}
        name="amount"
        label="Сумма"
        keyboardType="decimal-pad"
      />
      <FormSelect control={control} name="currency" label="Валюта" options={CURRENCIES} />
      {stageOptions.length > 0 ? (
        <FormSelect
          control={control}
          name="stageId"
          label="Этап воронки"
          options={stageOptions}
        />
      ) : null}
      <FormSelect
        control={control}
        name="priority"
        label="Приоритет"
        options={PRIORITIES}
      />
      <FormSelect
        control={control}
        name="temperature"
        label="Температура"
        options={TEMPERATURES}
      />
      <FormEntitySelect
        control={control}
        name="contact"
        label="Контакт"
        fetchOptions={fetchContacts}
      />
      <FormEntitySelect
        control={control}
        name="company"
        label="Компания"
        fetchOptions={fetchCompanies}
      />
      <FormDateField control={control} name="expectedDate" label="Дата закрытия" />
    </FormScreen>
  );
}
