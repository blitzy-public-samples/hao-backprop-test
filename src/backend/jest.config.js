/**
 * Jest Configuration File
 * Version: 1.0.0
 * 
 * This configuration file sets up Jest testing framework for the Node.js Hello World
 * server application. It defines test patterns, coverage thresholds, and other
 * test-related settings to ensure proper test execution and reporting.
 */

module.exports = {
  // Use Node.js as the test environment since this is a Node.js application
  testEnvironment: 'node',
  
  // Files to run after Jest is loaded (setup file for global test configuration)
  // Note: You'll need to create this file if it doesn't exist
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Patterns to match test files - looks for *.test.js files in __tests__ directories
  testMatch: ['**/__tests__/**/*.test.js'],
  
  // Files to include in coverage reports - includes all JS files except tests and configs
  collectCoverageFrom: [
    '**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  
  // Minimum coverage thresholds to enforce as per specifications
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90
    }
  },
  
  // Coverage report formats: text summary in console, lcov for CI tools, and HTML for detailed reports
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Timeout for test cases in milliseconds (5 seconds)
  testTimeout: 5000,
  
  // Clear mock calls and instances between tests
  clearMocks: true,
  
  // Reset mock state between tests
  resetMocks: true,
  
  // Restore mocked functions to their original implementation
  restoreMocks: true,
  
  // Display individual test results with the test suite hierarchy
  verbose: true
};