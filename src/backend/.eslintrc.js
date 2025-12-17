/**
 * @fileoverview ESLint configuration for NestJS Hello World application
 * @module ESLintConfig
 * @description Defines code quality rules and linting standards for TypeScript/NestJS.
 *              Integrates with Prettier for consistent code formatting and uses
 *              @typescript-eslint for TypeScript-specific linting rules.
 * 
 * This configuration:
 * - Enables TypeScript parsing with @typescript-eslint/parser
 * - Extends recommended TypeScript and Prettier configurations
 * - Provides custom rules optimized for NestJS development
 * - Includes special overrides for test files
 * 
 * @author Blitzy Platform
 * @version 2.0.0
 */

module.exports = {
  // Ensures ESLint stops looking for config files in parent directories
  // This prevents conflicts with any parent project ESLint configs
  root: true,

  // ============================================================================
  // Parser Configuration
  // ============================================================================
  // Use the TypeScript parser for all TypeScript files
  // This enables ESLint to understand TypeScript syntax
  parser: '@typescript-eslint/parser',

  // Parser options configure how the TypeScript parser behaves
  parserOptions: {
    // Reference to the TypeScript configuration file
    // This allows type-aware linting rules to work properly
    project: './tsconfig.json',

    // The root directory for resolving the tsconfig.json path
    // __dirname ensures the path is relative to this config file
    tsconfigRootDir: __dirname,

    // Specify the source type as ES modules
    // NestJS uses ES module syntax (import/export)
    sourceType: 'module',

    // ECMAScript version to support
    // ES2022 includes all modern JavaScript features needed
    ecmaVersion: 2022,
  },

  // ============================================================================
  // Environment Configuration
  // ============================================================================
  // Define the environments where the code will run
  // This affects which global variables ESLint recognizes
  env: {
    // Node.js global variables and Node.js scoping rules
    // Required for server-side NestJS applications
    node: true,

    // Jest global variables (describe, it, expect, etc.)
    // Required for test files to work without lint errors
    jest: true,

    // Enable all ECMAScript 2022 features and globals
    es2022: true,
  },

  // ============================================================================
  // Plugins Configuration
  // ============================================================================
  // Plugins provide additional rules beyond ESLint's built-in rules
  plugins: [
    // TypeScript-specific linting rules
    // Provides rules that understand TypeScript semantics
    '@typescript-eslint',

    // Prettier plugin for ESLint integration
    // Runs Prettier as an ESLint rule and reports formatting issues
    'prettier',
  ],

  // ============================================================================
  // Extended Configurations
  // ============================================================================
  // Inherit rules from these shareable configurations
  // Order matters: later configs override earlier ones
  extends: [
    // ESLint's recommended rules - baseline JavaScript best practices
    'eslint:recommended',

    // TypeScript ESLint recommended rules
    // Disables rules that conflict with TypeScript and adds TS-specific rules
    'plugin:@typescript-eslint/recommended',

    // Type-aware TypeScript rules (requires parserOptions.project)
    // These rules use TypeScript's type information for more accurate linting
    // Note: Slightly slower but catches more issues
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // Prettier configuration - MUST BE LAST
    // Disables all formatting rules that might conflict with Prettier
    // This ensures Prettier handles all formatting decisions
    'plugin:prettier/recommended',
  ],

  // ============================================================================
  // Custom Rules Configuration
  // ============================================================================
  // Override or add rules specific to this project's needs
  rules: {
    // ---------------------------------------------------------------------------
    // Console and Logging Rules
    // ---------------------------------------------------------------------------
    // Allow console statements - NestJS Logger wraps console internally
    // In production, prefer using NestJS's built-in Logger service
    'no-console': 'off',

    // ---------------------------------------------------------------------------
    // TypeScript-Specific Rules
    // ---------------------------------------------------------------------------
    // Prevent unused variables except for arguments prefixed with underscore
    // The underscore prefix is a common convention for intentionally unused params
    // Example: async function handler(_req: Request, res: Response) { }
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // Explicit function return types are not required
    // TypeScript can infer return types, and NestJS decorators work without them
    // Set to 'warn' if stricter typing is desired
    '@typescript-eslint/explicit-function-return-type': 'off',

    // Explicit module boundary types are not required
    // This rule would require explicit types on exported functions
    // NestJS decorators provide sufficient type information
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Warn when 'any' type is used explicitly
    // Encourages proper typing while allowing flexibility when needed
    // Set to 'error' for stricter enforcement
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow empty functions (common in NestJS for lifecycle hooks)
    // Example: onModuleInit() {} is valid when you just need to implement interface
    '@typescript-eslint/no-empty-function': [
      'warn',
      {
        allow: ['constructors', 'decoratedFunctions'],
      },
    ],

    // Allow require() imports when necessary
    // Some dynamic imports in NestJS may need require()
    '@typescript-eslint/no-require-imports': 'off',

    // ---------------------------------------------------------------------------
    // Modern JavaScript Best Practices
    // ---------------------------------------------------------------------------
    // Disallow var declarations - use let or const instead
    // var has function scope which can lead to bugs
    'no-var': 'error',

    // Prefer const for variables that are never reassigned
    // Makes code intent clearer and prevents accidental reassignment
    'prefer-const': 'error',

    // Require strict equality operators (=== and !==)
    // Prevents type coercion bugs
    'eqeqeq': ['error', 'always'],

    // Require curly braces for all control statements
    // Prevents bugs when adding statements to if/else blocks
    'curly': ['error', 'all'],

    // ---------------------------------------------------------------------------
    // Code Style and Formatting Rules
    // ---------------------------------------------------------------------------
    // Limit consecutive empty lines to improve readability
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxEOF: 1,
        maxBOF: 0,
      },
    ],

    // Enforce single quotes for strings (except when avoiding escapes)
    // Consistent string quote style across the codebase
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Require semicolons at the end of statements
    // Explicit semicolons prevent ASI (Automatic Semicolon Insertion) issues
    'semi': ['error', 'always'],

    // Require trailing commas in multiline structures
    // Makes git diffs cleaner when adding new items
    'comma-dangle': ['error', 'always-multiline'],

    // ---------------------------------------------------------------------------
    // Prettier Integration
    // ---------------------------------------------------------------------------
    // Run Prettier as an ESLint rule
    // This allows Prettier issues to be reported alongside other lint issues
    'prettier/prettier': [
      'error',
      {
        // Inherit settings from .prettierrc file
        // This comment documents the integration
      },
    ],
  },

  // ============================================================================
  // File-Specific Overrides
  // ============================================================================
  // Apply different rules to specific file patterns
  overrides: [
    {
      // Apply to all test files (unit tests and e2e tests)
      files: [
        '**/*.spec.ts',      // Unit test files
        '**/*.e2e-spec.ts',  // End-to-end test files
        'test/**/*.ts',      // All files in test directory
      ],
      rules: {
        // Allow unused expressions in tests
        // Required for expect(something).toBeTruthy() style assertions
        '@typescript-eslint/no-unused-expressions': 'off',

        // Allow floating promises in tests
        // Test frameworks handle promise rejections
        '@typescript-eslint/no-floating-promises': 'off',

        // Allow any type in tests for mocking flexibility
        '@typescript-eslint/no-explicit-any': 'off',

        // Allow non-null assertions in tests
        // Testing often involves asserting values exist
        '@typescript-eslint/no-non-null-assertion': 'off',

        // Allow unbound methods in tests (common in Jest mocking)
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      // Configuration files (this file, jest.config.js, etc.)
      files: ['*.js'],
      rules: {
        // Allow require() in JavaScript config files
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],

  // ============================================================================
  // Ignore Patterns
  // ============================================================================
  // Files and directories to exclude from linting
  ignorePatterns: [
    // Build output directory
    'dist/',

    // Package dependencies
    'node_modules/',

    // Coverage reports
    'coverage/',

    // TypeScript build info files
    '*.tsbuildinfo',

    // JavaScript files in src (should be TypeScript)
    // Uncomment if you want to lint only TypeScript:
    // 'src/**/*.js',
  ],
};
