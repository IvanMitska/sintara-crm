import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { contactsApi, dealsApi, type TaskInput } from '@/api';
import {
  FormDateField,
  FormEntitySelect,
  FormField,
  FormScreen,
  FormSelect,
  FormSwitch,
  type SelectOption,
} from '@/components/form';
import {
  useCreateRecurringTask,
  useCreateTask,
  useUpdateTask,
} from '@/hooks/mutations';
import { useTask } from '@/hooks/queries';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';
import type { TaskPriority } from '@/types';

const PRIORITIES: SelectOption[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочно' },
];

const PATTERNS: SelectOption[] = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'monthly', label: 'Ежемесячно' },
];

const schema = z.object({
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string(),
  contact: z.custom<SelectOption>().optional(),
  deal: z.custom<SelectOption>().optional(),
  recurring: z.boolean(),
  pattern: z.string(),
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

/** Создание/редактирование задачи (ТЗ §8.8, Фаза 3). */
export default function TaskFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const userId = useAuthStore((s) => s.user?.id);

  const existing = useTask(id ?? '');
  const create = useCreateTask();
  const createRecurring = useCreateRecurringTask();
  const update = useUpdateTask(id ?? '');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
      priority: 'MEDIUM',
      recurring: false,
      pattern: 'weekly',
    },
  });

  const recurring = useWatch({ control, name: 'recurring' });

  useEffect(() => {
    if (isEdit && existing.data) {
      const t = existing.data;
      reset({
        title: t.title,
        description: t.description ?? '',
        dueDate: t.dueDate ?? undefined,
        priority: t.priority,
        contact: t.contact
          ? { value: t.contact.id, label: `${t.contact.firstName} ${t.contact.lastName}` }
          : undefined,
        deal: t.deal ? { value: t.deal.id, label: t.deal.title } : undefined,
        recurring: false,
        pattern: 'weekly',
      });
    }
  }, [isEdit, existing.data, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: TaskInput = {
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate,
      priority: values.priority as TaskPriority,
      assigneeId: userId,
      contactId: values.contact?.value,
      dealId: values.deal?.value,
    };

    const done = (msg: string) => {
      toast.success(msg);
      router.back();
    };
    const fail = () => toast.error('Не удалось сохранить');

    if (isEdit) {
      update.mutate(payload, { onSuccess: () => done('Задача обновлена'), onError: fail });
    } else if (values.recurring) {
      createRecurring.mutate(
        { ...payload, pattern: values.pattern },
        { onSuccess: () => done('Повторяющаяся задача создана'), onError: fail },
      );
    } else {
      create.mutate(payload, { onSuccess: () => done('Задача создана'), onError: fail });
    }
  };

  return (
    <FormScreen
      title={isEdit ? 'Редактировать задачу' : 'Новая задача'}
      submitLabel={isEdit ? 'Сохранить' : 'Создать задачу'}
      submitting={create.isPending || update.isPending || createRecurring.isPending}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="title" label="Название" testID="task-title" />
      <FormField
        control={control}
        name="description"
        label="Описание"
        multiline
        numberOfLines={3}
      />
      <FormDateField control={control} name="dueDate" label="Срок" mode="datetime" />
      <FormSelect
        control={control}
        name="priority"
        label="Приоритет"
        options={PRIORITIES}
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
      {!isEdit ? (
        <>
          <FormSwitch
            control={control}
            name="recurring"
            label="Повторять"
            hint="Создать серию повторяющихся задач"
          />
          {recurring ? (
            <FormSelect
              control={control}
              name="pattern"
              label="Периодичность"
              options={PATTERNS}
            />
          ) : null}
        </>
      ) : null}
    </FormScreen>
  );
}
