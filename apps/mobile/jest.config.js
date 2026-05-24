/**
 * Jest для Фазы 1 — unit-тесты чистой логики (utils, сторы, RBAC).
 *
 * Используется ts-jest в node-окружении: на этапе каркаса все тесты —
 * без RN-импортов, а jest-expo + RN 0.76 + reanimated babel-плагин в
 * pnpm-монорепо требуют отдельной настройки. Когда в Фазе 2 появятся
 * component-тесты (@testing-library/react-native), сюда добавляется
 * второй jest-project с preset 'jest-expo'.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { isolatedModules: true, tsconfig: { module: 'commonjs', jsx: 'react-jsx' } },
    ],
  },
  collectCoverageFrom: ['src/lib/**/*.ts', 'src/store/**/*.ts', '!src/**/*.d.ts'],
};
