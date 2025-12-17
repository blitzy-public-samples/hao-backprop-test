/**
 * @fileoverview ESLint Flat Configuration for NestJS Hello World Application
 * @module ESLintConfig
 * @description Defines code quality rules and linting standards for TypeScript/NestJS.
 *              Uses ESLint 9.x flat config format with @typescript-eslint for
 *              TypeScript-specific linting rules and Prettier integration.
 * 
 * This configuration:
 * - Uses the new ESLint 9.x flat config format
 * - Enables TypeScript parsing with @typescript-eslint/parser
 * - Extends recommended TypeScript configurations
 * - Provides custom rules optimized for NestJS development
 * - Includes special overrides for test files
 * 
 * @author Blitzy Platform
 * @version 2.0.0
 */

const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');

/**
 * ESLint Flat Configuration Array
 * Each object in the array represents a configuration block.
 * Later blocks override earlier ones for matching files.
 */
module.exports = [
  // ==========================================================================
  // Global Ignores Configuration
  // ==========================================================================
  {
    /**
     * Files and directories to ignore globally.
     * These patterns apply to all configuration blocks.
     */
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.js',
      '!eslint.config.js',
    ],
  },

  // ==========================================================================
  // TypeScript Source Files Configuration
  // ==========================================================================
  {
    /**
     * Apply this configuration to all TypeScript files in src and test directories.
     */
    files: ['src/**/*.ts', 'test/**/*.ts'],

    /**
     * Language options configure how ESLint parses and understands code.
     */
    languageOptions: {
      /**
       * Use the TypeScript parser for all TypeScript files.
       * This enables ESLint to understand TypeScript syntax.
       */
      parser: tsParser,

      /**
       * Parser options configure how the TypeScript parser behaves.
       */
      parserOptions: {
        /**
         * Reference to the TypeScript configuration file.
         * This allows type-aware linting rules to work properly.
         */
        project: './tsconfig.json',

        /**
         * Specify the source type as ES modules.
         * NestJS uses ES module syntax (import/export).
         */
        sourceType: 'module',

        /**
         * ECMAScript version to support.
         * ES2022 includes all modern JavaScript features needed.
         */
        ecmaVersion: 2022,
      },

      /**
       * Global variables available in the code.
       * This affects which identifiers ESLint recognizes as valid globals.
       */
      globals: {
        // Node.js global variables
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        console: 'readonly',
        exports: 'readonly',
        // Jest global variables
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },

    /**
     * Plugins provide additional rules beyond ESLint's built-in rules.
     */
    plugins: {
      /**
       * TypeScript-specific linting rules.
       * Provides rules that understand TypeScript semantics.
       */
      '@typescript-eslint': tseslint,

      /**
       * Prettier plugin for ESLint integration.
       * Runs Prettier as an ESLint rule and reports formatting issues.
       */
      prettier: prettierPlugin,
    },

    /**
     * Rules configuration - defines which rules are enabled and their severity.
     */
    rules: {
      // -----------------------------------------------------------------------
      // ESLint Recommended Rules (manually included since flat config doesn't auto-extend)
      // -----------------------------------------------------------------------
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'no-undef': 'off', // TypeScript handles this
      'no-console': 'off', // Allow console for NestJS Logger
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],

      // -----------------------------------------------------------------------
      // TypeScript-Specific Rules
      // -----------------------------------------------------------------------
      /**
       * Prevent unused variables except for arguments prefixed with underscore.
       * The underscore prefix is a common convention for intentionally unused params.
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      /**
       * Explicit function return types are not required.
       * TypeScript can infer return types, and NestJS decorators work without them.
       */
      '@typescript-eslint/explicit-function-return-type': 'off',

      /**
       * Explicit module boundary types are not required.
       * NestJS decorators provide sufficient type information.
       */
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      /**
       * Warn when 'any' type is used explicitly.
       * Encourages proper typing while allowing flexibility when needed.
       */
      '@typescript-eslint/no-explicit-any': 'warn',

      /**
       * Allow empty functions (common in NestJS for lifecycle hooks).
       */
      '@typescript-eslint/no-empty-function': [
        'warn',
        {
          allow: ['constructors', 'decoratedFunctions'],
        },
      ],

      /**
       * Allow require() imports when necessary.
       */
      '@typescript-eslint/no-require-imports': 'off',

      // -----------------------------------------------------------------------
      // Code Style and Formatting Rules
      // -----------------------------------------------------------------------
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 1,
          maxBOF: 0,
        },
      ],

      /**
       * Enforce single quotes for strings.
       */
      'quotes': ['error', 'single', { avoidEscape: true }],

      /**
       * Require semicolons at the end of statements.
       */
      'semi': ['error', 'always'],

      /**
       * Require trailing commas in multiline structures.
       */
      'comma-dangle': ['error', 'always-multiline'],

      // -----------------------------------------------------------------------
      // Prettier Integration
      // -----------------------------------------------------------------------
      /**
       * Run Prettier as an ESLint rule.
       */
      'prettier/prettier': 'error',
    },
  },

  // ==========================================================================
  // Test Files Configuration (Relaxed Rules)
  // ==========================================================================
  {
    /**
     * Apply relaxed rules to test files.
     * Tests often need more flexibility than production code.
     */
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],

    /**
     * Relaxed rules for test files.
     */
    rules: {
      /**
       * Allow any type in tests for mocking flexibility.
       */
      '@typescript-eslint/no-explicit-any': 'off',

      /**
       * Allow non-null assertions in tests.
       */
      '@typescript-eslint/no-non-null-assertion': 'off',

      /**
       * Allow empty functions in tests.
       */
      '@typescript-eslint/no-empty-function': 'off',

      /**
       * Allow unused expressions in tests (for expect().toEqual()).
       */
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
