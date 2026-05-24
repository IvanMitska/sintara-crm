import 'react-native-reanimated';
import '@/lib/i18n';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { processOutbox } from '@/lib/offline-queue';
import { persistOptions, queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/** Редирект между (auth) и (tabs) по статусу авторизации. */
function useProtectedRoute(isAuthenticated: boolean, ready: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, ready, segments, router]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const setOffline = useUiStore((s) => s.setOffline);

  // Восстановление сессии при старте.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Маркер сети (ТЗ §11.1) + синхронизация outbox при восстановлении (§11.2).
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const isOffline = !(
        state.isConnected && state.isInternetReachable !== false
      );
      setOffline(isOffline);
      if (!isOffline) void processOutbox();
    });
    return unsub;
  }, [setOffline]);

  const sessionResolved = status !== 'idle' && status !== 'loading';
  const ready = fontsLoaded && sessionResolved;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useProtectedRoute(status === 'authenticated', ready);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
        >
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.base },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </BottomSheetModalProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
