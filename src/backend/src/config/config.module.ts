/**
 * @fileoverview NestJS configuration module for centralized config management
 *
 * This module wraps @nestjs/config ConfigModule to provide centralized,
 * type-safe configuration management throughout the application. It
 * transforms the vanilla Node.js config.js pattern into NestJS's
 * configuration module architecture.
 *
 * @module AppConfigModule
 *
 * @description
 * The AppConfigModule provides:
 *
 * - Global ConfigService availability without re-importing
 * - Type-safe configuration access via the configuration factory
 * - Environment file (.env) loading and parsing
 * - Configuration caching for performance
 *
 * This module replaces:
 * - config.js: The getConfig() function → ConfigService.get()
 * - config.js: The validatePort() function → Now in configuration.ts
 * - Manual require() of config → Dependency injection of ConfigService
 *
 * The 'AppConfigModule' name is used to avoid naming conflicts with
 * @nestjs/config's built-in ConfigModule.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/techniques/configuration NestJS Configuration}
 * @see {@link https://github.com/nestjs/config @nestjs/config Package}
 *
 * @example
 * // Import in AppModule
 * @Module({
 *   imports: [AppConfigModule],
 * })
 * export class AppModule {}
 *
 * @example
 * // Inject ConfigService in any service/controller
 * @Injectable()
 * export class SomeService {
 *   constructor(private configService: ConfigService) {}
 *
 *   getPort(): number {
 *     return this.configService.get<number>('port');
 *   }
 * }
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, NestJS config, local modules
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// Core module decorator for defining NestJS modules
import { Module } from '@nestjs/common';

// -----------------------------------------------------------------------------
// NestJS Configuration Package Imports
// -----------------------------------------------------------------------------
// ConfigModule for environment-based configuration management
import { ConfigModule } from '@nestjs/config';

// -----------------------------------------------------------------------------
// Local Configuration Factory Import
// -----------------------------------------------------------------------------
// Type-safe configuration factory with validation
import configuration from './configuration';

/* ============================================================================
 * APP CONFIG MODULE CLASS
 * ============================================================================
 * Configuration module providing global ConfigService access
 * ============================================================================ */

/**
 * Configuration module for centralized environment-based settings
 *
 * @class AppConfigModule
 *
 * @description
 * This module wraps NestJS's ConfigModule with application-specific
 * configuration, enabling type-safe access to environment variables
 * throughout the application.
 *
 * The @Module() decorator imports ConfigModule.forRoot() with the
 * following configuration:
 *
 * - isGlobal: true
 *   Makes ConfigService available in all modules without re-importing.
 *   This eliminates the need to import ConfigModule in every module
 *   that needs configuration access.
 *
 * - load: [configuration]
 *   Registers the configuration factory function that provides
 *   type-safe configuration with validation. The factory reads
 *   environment variables and applies defaults.
 *
 * - envFilePath: '.env'
 *   Specifies the path to the .env file. Environment variables from
 *   this file are loaded at application startup.
 *
 * - cache: true
 *   Enables caching of environment variables for better performance.
 *   Variables are read once and cached for subsequent accesses.
 *
 * Original vanilla Node.js transformation:
 * - config.js getConfig() → ConfigService.get()
 * - process.env direct access → ConfigService.get<T>()
 * - Manual validation → Configuration factory validation
 *
 * ConfigService usage after importing this module:
 * - configService.get('port') → Returns configured port (default: 3000)
 * - configService.get('nodeEnv') → Returns NODE_ENV value
 * - configService.get('logLevel') → Returns LOG_LEVEL value
 *
 * @example
 * // Using ConfigService in a service
 * @Injectable()
 * export class AppService {
 *   constructor(private configService: ConfigService) {}
 *
 *   getPort(): number {
 *     return this.configService.get<number>('port', 3000);
 *   }
 *
 *   isProduction(): boolean {
 *     return this.configService.get<boolean>('isProduction');
 *   }
 * }
 *
 * @example
 * // Using ConfigService in main.ts bootstrap
 * const configService = app.get(ConfigService);
 * const port = configService.get<number>('port', 3000);
 * await app.listen(port);
 */
@Module({
  // ---------------------------------------------------------------------------
  // Module Imports Configuration
  // ---------------------------------------------------------------------------
  // Import ConfigModule with application-specific settings
  imports: [
    ConfigModule.forRoot({
      // -----------------------------------------------------------------------
      // Global Availability
      // -----------------------------------------------------------------------
      // Makes ConfigService available in all modules without importing
      // This is equivalent to registering ConfigService as a global provider
      isGlobal: true,

      // -----------------------------------------------------------------------
      // Configuration Factory Registration
      // -----------------------------------------------------------------------
      // Load our type-safe configuration factory
      // The factory reads environment variables and applies validation
      load: [configuration],

      // -----------------------------------------------------------------------
      // Environment File Path
      // -----------------------------------------------------------------------
      // Specify the .env file location relative to the application root
      // NestJS will load variables from this file into process.env
      envFilePath: '.env',

      // -----------------------------------------------------------------------
      // Configuration Caching
      // -----------------------------------------------------------------------
      // Cache environment variables for better performance
      // Variables are read once at startup and cached in memory
      cache: true,
    }),
  ],

  // ---------------------------------------------------------------------------
  // Module Exports Configuration
  // ---------------------------------------------------------------------------
  // Re-export ConfigModule to allow explicit imports if needed
  // Not strictly necessary due to isGlobal: true, but good practice
  exports: [ConfigModule],
})
export class AppConfigModule {}
