module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'controller/**/*.ts',
    'utils/**/*.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
