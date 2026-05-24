/** ESLint для apps/mobile. Базируется на eslint-config-expo. */
module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['/dist', '/node_modules', '/.expo'],
  rules: {
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    // Запрет console в release-коде (ТЗ §20). dev-логи — через Sentry breadcrumbs.
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
