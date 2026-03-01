module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/shared/types.ts',  // Type definitions only
    '!src/shared/constants.ts',  // Constants only
  ],
  coverageThreshold: {
    // High coverage for testable utility/storage layers
    './src/utils/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/shared/storage.ts': {
      branches: 90,
      functions: 90,
      lines: 70,
      statements: 70,
    },
    './src/content/content-script.ts': {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['<rootDir>/tests/mocks/chrome.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
};
