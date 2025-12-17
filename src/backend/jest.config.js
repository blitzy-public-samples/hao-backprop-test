/**
 * @fileoverview Jest Configuration for NestJS TypeScript Application
 * @module JestConfig
 * @description
 * This configuration file sets up Jest testing framework for the NestJS Hello World
 * server application. It configures ts-jest for TypeScript compilation, defines test
 * patterns for .spec.ts files, coverage thresholds, and other test-related settings
 * to ensure proper test execution and reporting in a TypeScript environment.
 * 
 * @author Blitzy Platform
 * @version 2.0.0
 * 
 * Key Features:
 * - TypeScript support via ts-jest transformer
 * - Path alias resolution matching tsconfig.json
 * - Comprehensive code coverage configuration
 * - Strict coverage thresholds for quality assurance
 * - Proper mock handling between tests
 * 
 * @see {@link https://jestjs.io/docs/configuration} Jest Configuration Documentation
 * @see {@link https://kulshekhar.github.io/ts-jest/} ts-jest Documentation
 * @see {@link https://docs.nestjs.com/fundamentals/testing} NestJS Testing Documentation
 */

module.exports = {
  // ============================================================================
  // TEST ENVIRONMENT CONFIGURATION
  // ============================================================================
  
  /**
   * Use Node.js as the test environment since this is a NestJS server application.
   * This ensures Node.js globals (process, Buffer, etc.) are available in tests.
   */
  testEnvironment: 'node',
  
  /**
   * File extensions Jest will look for when resolving modules.
   * TypeScript files (.ts) are listed first for faster resolution in a
   * TypeScript-first project. JSON is included for configuration file imports.
   */
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // ============================================================================
  // SOURCE AND TEST FILE CONFIGURATION
  // ============================================================================
  
  /**
   * Root directory for Jest to scan for tests and modules.
   * Points to the NestJS source directory where all TypeScript source files reside.
   * All relative paths in this configuration are resolved from this directory.
   */
  rootDir: 'src',
  
  /**
   * Patterns to match test files.
   * Matches all files ending with .spec.ts or .test.ts anywhere in the project.
   * NestJS convention uses .spec.ts for unit tests co-located with source files.
   * 
   * Pattern explanation:
   * - **\/*.spec.ts: Matches any .spec.ts file in any subdirectory
   * - **\/*.test.ts: Matches any .test.ts file in any subdirectory (alternative naming)
   */
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  
  /**
   * Paths to ignore when searching for test files.
   * Excludes node_modules to avoid running tests from dependencies,
   * and dist to avoid running compiled JavaScript tests.
   */
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // ============================================================================
  // TYPESCRIPT TRANSFORMATION
  // ============================================================================
  
  /**
   * Transform configuration for TypeScript compilation.
   * Uses ts-jest to compile TypeScript files on-the-fly during test execution.
   * 
   * Pattern '^.+\\.(t|j)s$' matches:
   * - All .ts files (TypeScript source)
   * - All .js files (JavaScript source, if any)
   * 
   * ts-jest automatically uses the project's tsconfig.json for compilation settings.
   */
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  /**
   * Module path alias mapping for clean imports.
   * Maps 'src/*' imports to the actual source directory, matching the
   * paths configuration in tsconfig.json for consistent module resolution.
   * 
   * This allows tests to import modules using:
   *   import { AppService } from 'src/app.service';
   * instead of relative paths like:
   *   import { AppService } from '../../../app.service';
   */
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  
  // ============================================================================
  // CODE COVERAGE CONFIGURATION
  // ============================================================================
  
  /**
   * Directory where Jest should output coverage reports.
   * Set to '../coverage' to output coverage files outside the src/ directory,
   * keeping the source tree clean and making it easier to configure .gitignore.
   */
  coverageDirectory: '../coverage',
  
  /**
   * Patterns specifying which files to include in coverage reports.
   * Includes all TypeScript files while excluding:
   * - Module files (*.module.ts) - these are configuration, not business logic
   * - Node modules - third-party dependencies
   * - Dist folder - compiled output
   * - Type declaration files (*.d.ts) - no runtime code
   * - Main bootstrap file (main.ts) - application entry point with minimal logic
   * - Test files themselves
   * 
   * This ensures coverage metrics reflect actual application logic quality.
   */
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.module.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
    '!main.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
  ],
  
  /**
   * Minimum coverage thresholds to enforce.
   * Tests will fail if coverage drops below these percentages.
   * These thresholds ensure high code quality as per project specifications:
   * 
   * - statements: 90% - Percentage of statements executed
   * - branches: 85% - Percentage of if/else branches taken
   * - functions: 95% - Percentage of functions called
   * - lines: 90% - Percentage of lines executed
   * 
   * Note: branches threshold is slightly lower due to the complexity of
   * testing all conditional paths in error handling scenarios.
   */
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90,
    },
  },
  
  /**
   * Coverage report output formats.
   * - text: Summary displayed in console after test run
   * - lcov: Standard format for CI/CD tools (SonarQube, Codecov, etc.)
   * - html: Detailed interactive report for local development review
   */
  coverageReporters: ['text', 'lcov', 'html'],
  
  // ============================================================================
  // TEST EXECUTION SETTINGS
  // ============================================================================
  
  /**
   * Maximum time in milliseconds a test can run before it's considered failed.
   * Set to 5 seconds to allow for async operations while catching infinite loops.
   * Increase this value if tests involve slow external services.
   */
  testTimeout: 5000,
  
  // ============================================================================
  // MOCK CONFIGURATION
  // ============================================================================
  
  /**
   * Automatically clear mock call history and instances between tests.
   * This prevents mock state from leaking between tests, ensuring test isolation.
   * Each test starts with fresh mock call counts (mock.mock.calls = []).
   */
  clearMocks: true,
  
  /**
   * Automatically reset mock state between tests.
   * This resets all mock implementations to their initial state,
   * removing any custom return values or implementations set during a test.
   */
  resetMocks: true,
  
  /**
   * Automatically restore mocked functions to their original implementation.
   * This ensures that mocks created with jest.spyOn() are properly cleaned up,
   * preventing mocked implementations from affecting subsequent tests.
   */
  restoreMocks: true,
  
  // ============================================================================
  // OUTPUT CONFIGURATION
  // ============================================================================
  
  /**
   * Display individual test results with the test suite hierarchy.
   * When true, Jest prints the description of each test as it runs,
   * making it easier to identify which tests are passing or failing.
   */
  verbose: true,
};
