/** RBAC-хелпер (ТЗ §13). Клиентский — backend всё равно валидирует. */
import { can, type PermissionAction } from '@/lib/permissions';
import { useAuthStore } from '@/store/auth.store';

export function useCan(action: PermissionAction): boolean {
  const userRole = useAuthStore((s) => s.user?.role ?? null);
  const orgRole = useAuthStore((s) => s.orgRole);
  return can(action, { userRole, orgRole });
}
