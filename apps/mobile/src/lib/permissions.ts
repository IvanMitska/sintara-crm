/**
 * Клиентский RBAC (ТЗ §13). Только для UX — backend всё равно валидирует.
 * Роли: User.role (UserRole) + OrgMember.role (OrgRole).
 */
import type { OrgRole, UserRole } from '@/types';

export type PermissionAction =
  | 'deals.viewAll'
  | 'deals.delete'
  | 'deals.reassign'
  | 'contacts.merge'
  | 'analytics.view'
  | 'team.view'
  | 'team.manage'
  | 'invitations.manage'
  | 'organization.manage'
  | 'automation.toggle';

interface PermissionContext {
  userRole: UserRole | null;
  orgRole: OrgRole | null;
}

/** OPERATOR — самый ограниченный; OWNER/ADMIN — полный доступ. */
function isManagerUp(role: UserRole | null): boolean {
  return role === 'MANAGER' || role === 'SUPERVISOR' || role === 'ADMIN';
}

function isAdminUp(ctx: PermissionContext): boolean {
  return ctx.userRole === 'ADMIN' || ctx.orgRole === 'ADMIN' || ctx.orgRole === 'OWNER';
}

export function can(action: PermissionAction, ctx: PermissionContext): boolean {
  switch (action) {
    case 'deals.viewAll':
    case 'deals.delete':
    case 'deals.reassign':
    case 'contacts.merge':
    case 'analytics.view':
    case 'team.view':
    case 'automation.toggle':
      return isManagerUp(ctx.userRole);

    case 'team.manage':
    case 'invitations.manage':
    case 'organization.manage':
      return isAdminUp(ctx);

    default:
      return false;
  }
}
