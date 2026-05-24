import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';

/** Точка входа: разводит на (tabs) или (auth) по статусу сессии. */
export default function Index() {
  const status = useAuthStore((s) => s.status);
  if (status === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/sign-in" />;
}
