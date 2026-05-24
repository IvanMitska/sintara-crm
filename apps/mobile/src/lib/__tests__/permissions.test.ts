import { can } from '../permissions';

describe('RBAC can()', () => {
  it('OPERATOR не видит аналитику и не управляет командой', () => {
    const ctx = { userRole: 'OPERATOR' as const, orgRole: 'OPERATOR' as const };
    expect(can('analytics.view', ctx)).toBe(false);
    expect(can('team.view', ctx)).toBe(false);
    expect(can('team.manage', ctx)).toBe(false);
  });

  it('MANAGER видит аналитику и команду, но не управляет членами', () => {
    const ctx = { userRole: 'MANAGER' as const, orgRole: 'MANAGER' as const };
    expect(can('analytics.view', ctx)).toBe(true);
    expect(can('team.view', ctx)).toBe(true);
    expect(can('automation.toggle', ctx)).toBe(true);
    expect(can('team.manage', ctx)).toBe(false);
    expect(can('invitations.manage', ctx)).toBe(false);
  });

  it('OWNER управляет организацией и приглашениями', () => {
    const ctx = { userRole: 'MANAGER' as const, orgRole: 'OWNER' as const };
    expect(can('organization.manage', ctx)).toBe(true);
    expect(can('invitations.manage', ctx)).toBe(true);
    expect(can('team.manage', ctx)).toBe(true);
  });

  it('ADMIN (UserRole) управляет командой', () => {
    const ctx = { userRole: 'ADMIN' as const, orgRole: null };
    expect(can('team.manage', ctx)).toBe(true);
  });
});
