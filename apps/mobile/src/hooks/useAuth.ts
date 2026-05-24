/** Удобный доступ к auth-стору. */
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  return useAuthStore((s) => ({
    status: s.status,
    user: s.user,
    organization: s.organization,
    isAuthenticated: s.status === 'authenticated',
  }));
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
