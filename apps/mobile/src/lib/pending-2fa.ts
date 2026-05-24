/**
 * Эфемерное хранилище учётных данных между sign-in и two-factor.
 * В памяти, никогда не персистится и не логируется (ТЗ §16.7).
 */
let pending: { email: string; password: string } | null = null;

export const pending2FA = {
  set(email: string, password: string): void {
    pending = { email, password };
  },
  get(): { email: string; password: string } | null {
    return pending;
  },
  clear(): void {
    pending = null;
  },
};
