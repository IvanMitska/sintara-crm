import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { contactsApi, type BookingInput } from '@/api';
import {
  FormDateField,
  FormEntitySelect,
  FormField,
  FormScreen,
  FormSelect,
  type SelectOption,
} from '@/components/form';
import { useCreateBooking } from '@/hooks/mutations';
import { useResources, useServices } from '@/hooks/queries';
import { toast } from '@/lib/toast';

const schema = z.object({
  resourceId: z.string().min(1, 'Выберите ресурс'),
  serviceId: z.string().optional(),
  startTime: z.string({ required_error: 'Укажите время начала' }),
  endTime: z.string({ required_error: 'Укажите время окончания' }),
  contact: z.custom<SelectOption>().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const fetchContacts = (q: string) =>
  contactsApi
    .list({ search: q || undefined, take: 10 })
    .then((r) =>
      r.data.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
    );

/** Создание брони (ТЗ §8.12, Фаза 3). */
export default function BookingFormScreen() {
  const resources = useResources();
  const services = useServices();
  const create = useCreateBooking();

  const resourceOptions: SelectOption[] = useMemo(
    () => (resources.data ?? []).map((r) => ({ value: r.id, label: r.name })),
    [resources.data],
  );
  const serviceOptions: SelectOption[] = useMemo(
    () => (services.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [services.data],
  );

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { resourceId: '', serviceId: '', notes: '' },
  });

  const onSubmit = (values: FormValues) => {
    const payload: BookingInput = {
      resourceId: values.resourceId,
      serviceId: values.serviceId || undefined,
      startTime: values.startTime,
      endTime: values.endTime,
      contactId: values.contact?.value,
      notes: values.notes || undefined,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Бронь создана');
        router.back();
      },
      onError: () => toast.error('Не удалось создать бронь'),
    });
  };

  return (
    <FormScreen
      title="Новая запись"
      submitLabel="Создать бронь"
      submitting={create.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormSelect
        control={control}
        name="resourceId"
        label="Ресурс"
        options={resourceOptions}
      />
      <FormSelect
        control={control}
        name="serviceId"
        label="Услуга"
        options={serviceOptions}
      />
      <FormDateField
        control={control}
        name="startTime"
        label="Начало"
        mode="datetime"
      />
      <FormDateField
        control={control}
        name="endTime"
        label="Окончание"
        mode="datetime"
      />
      <FormEntitySelect
        control={control}
        name="contact"
        label="Клиент"
        fetchOptions={fetchContacts}
      />
      <FormField
        control={control}
        name="notes"
        label="Заметки"
        multiline
        numberOfLines={3}
      />
    </FormScreen>
  );
}
