/**
 * @fileoverview Jest Configuration for NestJS TypeScript Application
 * @description Configures Jest testing framework for TypeScript-based NestJS application
 *              with ts-jest transformer, code coverage thresholds, and test file patterns.
 * @module JestConfig
 */

module.exports = {
  // Test environment to use
  testEnvironment: 'node',

  // Module file extensions for resolving
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Root directory for tests
  rootDir: 'src',

  // Pattern for test files
  testRegex: '.*\\.spec\\.ts$',

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage collection patterns
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.module.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
    '!main.ts',
  ],

  // Coverage output directory
  coverageDirectory: '../coverage',

  // Coverage thresholds - maintaining existing requirements
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout
  testTimeout: 5000,

  // Mock clearing and restoration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
