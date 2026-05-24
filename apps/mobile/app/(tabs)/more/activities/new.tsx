import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { contactsApi, dealsApi, type ActivityInput } from '@/api';
import {
  FormEntitySelect,
  FormField,
  FormScreen,
  FormSelect,
  type SelectOption,
} from '@/components/form';
import { useCreateActivity } from '@/hooks/mutations';
import { toast } from '@/lib/toast';

const TYPES: SelectOption[] = [
  { value: 'NOTE', label: 'Заметка' },
  { value: 'CALL', label: 'Звонок' },
  { value: 'MEETING', label: 'Встреча' },
  { value: 'EMAIL', label: 'Email' },
];

const schema = z.object({
  type: z.string(),
  description: z.string().min(1, 'Опишите активность'),
  contact: z.custom<SelectOption>().optional(),
  deal: z.custom<SelectOption>().optional(),
});
type FormValues = z.infer<typeof schema>;

const fetchContacts = (q: string) =>
  contactsApi
    .list({ search: q || undefined, take: 10 })
    .then((r) =>
      r.data.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
    );

const fetchDeals = (q: string) =>
  dealsApi
    .list({ search: q || undefined, take: 10 })
    .then((r) => r.data.map((d) => ({ value: d.id, label: d.title })));

/** Создание активности/заметки (ТЗ §8.14, Фаза 3). */
export default function ActivityFormScreen() {
  const params = useLocalSearchParams<{ contactId?: string; dealId?: string }>();
  const create = useCreateActivity();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'NOTE', description: '' },
  });

  const onSubmit = (values: FormValues) => {
    const payload: ActivityInput = {
      type: values.type,
      description: values.description,
      contactId: values.contact?.value ?? params.contactId,
      dealId: values.deal?.value ?? params.dealId,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Активность добавлена');
        router.back();
      },
      onError: () => toast.error('Не удалось сохранить'),
    });
  };

  return (
    <FormScreen
      title="Новая активность"
      submitLabel="Добавить"
      submitting={create.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormSelect control={control} name="type" label="Тип" options={TYPES} />
      <FormField
        control={control}
        name="description"
        label="Описание"
        multiline
        numberOfLines={5}
      />
      <FormEntitySelect
        control={control}
        name="contact"
        label="Контакт"
        fetchOptions={fetchContacts}
      />
      <FormEntitySelect
        control={control}
        name="deal"
        label="Сделка"
        fetchOptions={fetchDeals}
      />
    </FormScreen>
  );
}
