/**
 * Защищённое хранилище для refresh-токена (Keychain / Keystore).
 * accessToken здесь НЕ хранится — он живёт в памяти + зашифрованном MMKV (ТЗ §12).
 */
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'sintara.refreshToken';
const BIOMETRIC_BOUND_KEY = 'sintara.biometricBound';

export async function saveRefreshToken(
  token: string,
  options?: { biometricBound?: boolean },
): Promise<void> {
  const biometricBound = options?.biometricBound ?? false;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // При biometricBound доступ к токену требует подтверждения биометрии.
    requireAuthentication: biometricBound,
  });
  await SecureStore.setItemAsync(BIOMETRIC_BOUND_KEY, biometricBound ? '1' : '0');
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Пользователь отменил биометрию / Keychain недоступен.
    return null;
  }
}

export async function isRefreshTokenBiometricBound(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(BIOMETRIC_BOUND_KEY);
  return v === '1';
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_BOUND_KEY);
}
