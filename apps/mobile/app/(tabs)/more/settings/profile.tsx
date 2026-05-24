import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { usersApi } from '@/api';
import { FormField, FormScreen } from '@/components/form';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** Личные данные (ТЗ §8.16.1). */
export default function ProfileSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      const updated = await usersApi.updateProfile(user.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
      });
      setUser(updated);
      toast.success('Профиль обновлён');
      router.back();
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  return (
    <FormScreen
      title="Личные данные"
      submitLabel="Сохранить"
      submitting={formState.isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField control={control} name="firstName" label="Имя" />
      <FormField control={control} name="lastName" label="Фамилия" />
      <FormField
        control={control}
        name="phone"
        label="Телефон"
        keyboardType="phone-pad"
      />
    </FormScreen>
  );
}
