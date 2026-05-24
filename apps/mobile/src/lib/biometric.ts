/** Биометрия для входа (ТЗ §12, §8.16.3). */
import * as LocalAuthentication from 'expo-local-authentication';

/** Доступна ли биометрия на устройстве и настроена ли. */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

/** Запрос биометрического подтверждения. true — успех. */
export async function authenticateBiometric(prompt: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Отмена',
    disableDeviceFallback: false,
  });
  return result.success;
}
