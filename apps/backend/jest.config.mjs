/** @type {import('jest').Config} */
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/generated/**',
    '!src/**/*.dto.ts',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
};
