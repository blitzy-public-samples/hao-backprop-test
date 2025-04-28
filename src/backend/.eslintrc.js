/**
 * ESLint configuration for Node.js Hello World application
 * Defines code quality rules and linting standards
 * Integrates with Prettier for consistent code formatting
 * @version 1.0.0
 */

module.exports = {
  // Define environments where the code will run
  env: {
    node: true,   // Node.js global variables and Node.js scoping
    jest: true,   // Jest global variables for testing
    es2022: true, // Enable all ECMAScript 2022 features
  },
  
  // Extend from recommended configurations
  extends: [
    'eslint:recommended', // ESLint recommended rules
    'prettier',           // Prettier integration (eslint-config-prettier v8.5.0)
  ],
  
  // JavaScript language options
  parserOptions: {
    ecmaVersion: 2022,  // Specify ECMAScript version
    sourceType: 'module', // Code is in ECMAScript modules
  },
  
  // Custom rules configuration
  rules: {
    // Allow console statements (needed for server logging)
    'no-console': 'off',
    
    // Prevent unused variables except for arguments prefixed with underscore
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    
    // Enforce modern JavaScript practices
    'no-var': 'error',           // Use let or const instead of var
    'prefer-const': 'error',      // Use const for variables never reassigned
    'eqeqeq': ['error', 'always'], // Require === and !==
    'curly': ['error', 'all'],     // Require curly braces for all control statements
    
    // Formatting preferences
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  
  // Special configurations for specific file patterns
  overrides: [
    {
      files: ['**/__tests__/**/*.js'], // Apply only to test files
      rules: {
        'no-unused-expressions': 'off', // Allow unused expressions in tests (for expect assertions)
      },
    },
  ],
};