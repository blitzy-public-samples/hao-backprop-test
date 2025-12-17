/**
 * @fileoverview NestJS Configuration Factory Module
 *
 * This module provides type-safe environment configuration for the NestJS Hello World
 * server application. It transforms the original vanilla Node.js config.js functionality
 * into a NestJS-compatible configuration factory that integrates with @nestjs/config.
 *
 * The configuration factory reads environment variables (PORT, NODE_ENV, LOG_LEVEL)
 * and returns a strongly-typed configuration object. Port validation logic from the
 * original implementation is preserved, ensuring the port is within the valid range
 * of 1024-65535 for non-privileged TCP ports.
 *
 * @module configuration
 * @description Environment configuration management for NestJS application
 * @author Blitzy Platform
 * @see {@link src/backend/config.js} - Original vanilla Node.js configuration
 * @see {@link src/backend/utils/constants.js} - Original constants module
 *
 * @example
 * // Usage with ConfigModule in app.module.ts:
 * import { ConfigModule } from '@nestjs/config';
 * import configuration from './config/configuration';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       load: [configuration],
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // Accessing configuration via ConfigService:
 * import { ConfigService } from '@nestjs/config';
 * import { AppConfiguration } from './config/configuration';
 *
 * @Injectable()
 * export class SomeService {
 *   constructor(private configService: ConfigService<AppConfiguration>) {
 *     const port = this.configService.get('port');
 *   }
 * }
 */

// ============================================================================
// External Imports
// ============================================================================
// NestJS Logger for consistent logging format when validation warnings occur
import { Logger } from '@nestjs/common';

// ============================================================================
// Configuration Constants
// ============================================================================
// These constants are derived from the original utils/constants.js CONFIG object
// and define default values and constraints for the configuration

/**
 * Default server port when PORT environment variable is not specified or invalid.
 * This value matches the original CONFIG.DEFAULT_PORT from constants.js.
 * Port 3000 is commonly used for development servers and avoids conflicts
 * with well-known ports (0-1023) and other common development tools.
 */
const DEFAULT_PORT = 3000;

/**
 * Environment variable name for port configuration.
 * Matches the original CONFIG.ENV_VAR_PORT from constants.js.
 */
const ENV_VAR_PORT = 'PORT';

/**
 * Minimum valid port number for the server.
 * Ports 0-1023 are reserved for well-known services (HTTP, HTTPS, SSH, etc.)
 * and typically require elevated/root privileges to bind.
 * Using ports >= 1024 allows the application to run as a non-privileged user.
 */
const MIN_PORT = 1024;

/**
 * Maximum valid port number for TCP/IP networking.
 * Port numbers are 16-bit unsigned integers, so the maximum value is 65535.
 * This is a fundamental constraint of the TCP/IP protocol.
 */
const MAX_PORT = 65535;

/**
 * Default Node.js environment mode when NODE_ENV is not specified.
 * 'development' mode typically enables verbose logging and detailed error messages.
 */
const DEFAULT_NODE_ENV = 'development';

/**
 * Default logging level when LOG_LEVEL environment variable is not specified.
 * 'info' provides a balance between verbosity and useful operational information.
 */
const DEFAULT_LOG_LEVEL = 'info';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Application Configuration Interface
 *
 * Defines the shape of the configuration object returned by the configuration factory.
 * This interface provides type safety when accessing configuration values through
 * NestJS ConfigService and ensures consistent typing throughout the application.
 *
 * @interface AppConfiguration
 * @description Type-safe configuration shape for the NestJS application
 *
 * @property {number} port - The TCP port number on which the HTTP server listens.
 *   Valid range: 1024-65535. Defaults to 3000 if not specified or invalid.
 *
 * @property {string} nodeEnv - The current Node.js environment mode.
 *   Common values: 'development', 'production', 'test'.
 *   Affects logging verbosity, error detail levels, and application behavior.
 *
 * @property {string} logLevel - The logging verbosity level.
 *   Valid values: 'error', 'warn', 'info', 'debug'.
 *   Controls which log messages are output by the application logger.
 *
 * @property {boolean} isProduction - Derived boolean indicating production environment.
 *   True when nodeEnv === 'production'. Used for conditional production-only logic
 *   such as disabling detailed error messages or enabling performance optimizations.
 *
 * @property {boolean} isDevelopment - Derived boolean indicating development environment.
 *   True when nodeEnv === 'development'. Used for conditional development-only logic
 *   such as enabling hot-reload, verbose logging, or development tools.
 *
 * @example
 * // Type-safe configuration access with ConfigService:
 * const config = this.configService.get<AppConfiguration>('config');
 * if (config.isProduction) {
 *   // Production-specific logic
 * }
 *
 * @example
 * // Accessing individual configuration properties:
 * const port: number = this.configService.get<number>('port');
 * const logLevel: string = this.configService.get<string>('logLevel');
 */
export interface AppConfiguration {
  /**
   * The TCP port number on which the HTTP server will listen for incoming connections.
   * Must be in the valid range of 1024-65535 (non-privileged ports).
   * Defaults to 3000 if the PORT environment variable is not set or is invalid.
   */
  port: number;

  /**
   * The current Node.js environment mode, read from NODE_ENV environment variable.
   * Determines application behavior, logging verbosity, and error handling.
   * Common values: 'development', 'production', 'test', 'staging'.
   */
  nodeEnv: string;

  /**
   * The logging verbosity level, read from LOG_LEVEL environment variable.
   * Controls which severity levels of log messages are output.
   * Valid values: 'error', 'warn', 'info', 'debug' (in order of increasing verbosity).
   */
  logLevel: string;

  /**
   * Derived boolean flag indicating whether the application is running in production mode.
   * True when nodeEnv === 'production'.
   * Use this flag for production-specific behavior like:
   * - Disabling detailed error stack traces in responses
   * - Enabling production optimizations
   * - Adjusting cache settings
   */
  isProduction: boolean;

  /**
   * Derived boolean flag indicating whether the application is running in development mode.
   * True when nodeEnv === 'development'.
   * Use this flag for development-specific behavior like:
   * - Enabling hot-reload features
   * - Showing detailed error messages
   * - Enabling development debugging tools
   */
  isDevelopment: boolean;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a port value is a valid number within the acceptable range for TCP/IP ports.
 *
 * This function preserves the validation logic from the original config.js validatePort function.
 * It converts string input to a number and validates that the result is:
 * 1. A valid number (not NaN)
 * 2. Within the valid non-privileged port range (1024-65535)
 *
 * The port range 1024-65535 is used because:
 * - Ports 0-1023 are "well-known ports" reserved for privileged system services
 * - Binding to ports below 1024 typically requires root/administrator privileges
 * - Port 65535 is the maximum value for a 16-bit unsigned port number in TCP/IP
 *
 * @function validatePort
 * @param {string | undefined} port - The port value to validate, typically from process.env.PORT
 * @returns {number} The validated port number, or DEFAULT_PORT (3000) if validation fails
 *
 * @example
 * // Valid port string
 * const port1 = validatePort('8080');  // Returns 8080
 *
 * @example
 * // Invalid port (not a number)
 * const port2 = validatePort('abc');   // Returns 3000 (default)
 *
 * @example
 * // Port outside valid range
 * const port3 = validatePort('80');    // Returns 3000 (default) - port 80 is privileged
 *
 * @example
 * // Undefined port (common when env var is not set)
 * const port4 = validatePort(undefined);  // Returns 3000 (default)
 *
 * @see {@link https://www.iana.org/assignments/service-names-port-numbers} - IANA Port Assignments
 */
export function validatePort(port: string | undefined): number {
  // Create a logger instance for validation warnings
  // Using NestJS Logger for consistent logging format across the application
  const logger = new Logger('Configuration');

  // Handle undefined input (when environment variable is not set)
  // This is the most common case and should return the default port silently
  if (port === undefined || port === null || port === '') {
    // No warning logged for undefined - this is expected behavior
    // The calling code will use the default port
    return DEFAULT_PORT;
  }

  // Convert string port value to a number using parseInt with base 10
  // parseInt is used instead of Number() to handle strings like "3000abc" more gracefully
  // (parseInt would return 3000, Number() would return NaN)
  // However, we use base 10 explicitly to avoid octal interpretation of leading zeros
  const portNumber = parseInt(port, 10);

  // Check if the conversion resulted in NaN (Not a Number)
  // This handles cases where the port string is completely non-numeric (e.g., "abc")
  if (isNaN(portNumber)) {
    // Log a warning using NestJS Logger for invalid port format
    // This matches the original behavior from config.js which used logger.warn
    logger.warn(
      `Invalid port value: "${port}" is not a valid number. Using default port ${DEFAULT_PORT}.`,
    );
    return DEFAULT_PORT;
  }

  // Validate that the port is within the acceptable range (1024-65535)
  // Ports below 1024 are reserved for well-known services and require elevated privileges
  // Port 65535 is the maximum value for a 16-bit unsigned integer (TCP/IP port limit)
  if (portNumber < MIN_PORT || portNumber > MAX_PORT) {
    // Log a warning for out-of-range port values
    // This helps developers identify configuration issues during startup
    logger.warn(
      `Invalid port range: ${portNumber} is outside the valid range (${MIN_PORT}-${MAX_PORT}). ` +
        `Using default port ${DEFAULT_PORT}.`,
    );
    return DEFAULT_PORT;
  }

  // Port is valid - return the parsed number
  // At this point, we have confirmed:
  // 1. The port is a valid number (not NaN)
  // 2. The port is within the valid range (1024-65535)
  return portNumber;
}

// ============================================================================
// Configuration Factory
// ============================================================================

/**
 * NestJS Configuration Factory Function
 *
 * This is the main configuration factory that creates a type-safe configuration object
 * from environment variables. It is designed to be used with NestJS ConfigModule.forRoot()
 * and provides the application-wide configuration accessible via ConfigService.
 *
 * The factory reads the following environment variables:
 * - PORT: Server port number (validated to range 1024-65535, default: 3000)
 * - NODE_ENV: Environment mode (default: 'development')
 * - LOG_LEVEL: Logging verbosity (default: 'info')
 *
 * It also derives computed properties:
 * - isProduction: true when NODE_ENV === 'production'
 * - isDevelopment: true when NODE_ENV === 'development'
 *
 * This factory function is the NestJS equivalent of the original config.js getConfig() function,
 * enhanced with TypeScript typing and additional configuration properties for the NestJS
 * application context.
 *
 * @function default
 * @returns {AppConfiguration} Type-safe configuration object with all application settings
 *
 * @example
 * // Register configuration in AppModule:
 * import { ConfigModule } from '@nestjs/config';
 * import configuration from './config/configuration';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       load: [configuration],
 *       isGlobal: true,  // Makes ConfigService available globally
 *       cache: true,     // Cache configuration for performance
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // Access configuration in a service:
 * @Injectable()
 * export class MyService {
 *   constructor(private configService: ConfigService) {
 *     // Access the port configuration
 *     const port = this.configService.get<number>('port');
 *
 *     // Check environment mode
 *     const isProduction = this.configService.get<boolean>('isProduction');
 *   }
 * }
 *
 * @example
 * // Access full configuration object:
 * const config = configService.get<AppConfiguration>('config');
 * console.log(`Running on port ${config.port} in ${config.nodeEnv} mode`);
 *
 * @see {@link AppConfiguration} - The interface defining the configuration shape
 * @see {@link validatePort} - Port validation function used internally
 * @see {@link https://docs.nestjs.com/techniques/configuration} - NestJS Configuration Documentation
 */
export default (): AppConfiguration => {
  // Read and validate the PORT environment variable
  // The validatePort function ensures the port is a valid number in range 1024-65535
  // Falls back to DEFAULT_PORT (3000) if the value is invalid or not set
  const port = validatePort(process.env[ENV_VAR_PORT]);

  // Read the NODE_ENV environment variable to determine the application environment
  // This affects logging, error handling, and other environment-specific behaviors
  // Defaults to 'development' if not set, which is the safest default for local work
  const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;

  // Read the LOG_LEVEL environment variable to control logging verbosity
  // Valid values are typically: 'error', 'warn', 'info', 'debug'
  // Defaults to 'info' which provides a good balance of information
  const logLevel = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

  // Derive the isProduction flag from nodeEnv
  // This boolean is useful for conditional production-only logic throughout the app
  // Examples: disabling debug logs, enabling production optimizations, etc.
  const isProduction = nodeEnv === 'production';

  // Derive the isDevelopment flag from nodeEnv
  // This boolean is useful for conditional development-only logic
  // Examples: enabling hot-reload, showing detailed errors, dev tools, etc.
  const isDevelopment = nodeEnv === 'development';

  // Return the fully-typed configuration object
  // All properties are type-safe and can be accessed via ConfigService with proper typing
  return {
    // Server port configuration
    // The port on which the NestJS HTTP server will listen for incoming requests
    port,

    // Node.js environment mode
    // Used to determine environment-specific behavior throughout the application
    nodeEnv,

    // Logging verbosity level
    // Controls which log messages are output by the application logger
    logLevel,

    // Derived boolean for production environment checks
    // Convenient flag for production-specific conditional logic
    isProduction,

    // Derived boolean for development environment checks
    // Convenient flag for development-specific conditional logic
    isDevelopment,
  };
};
