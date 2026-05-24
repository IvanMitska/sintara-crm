/** Условный рендер по RBAC (ТЗ §13): <Can action="team.manage">…</Can>. */
import { useCan } from '@/hooks/useCan';
import type { PermissionAction } from '@/lib/permissions';

interface CanProps {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ action, children, fallback = null }: CanProps) {
  const allowed = useCan(action);
  return <>{allowed ? children : fallback}</>;
}
