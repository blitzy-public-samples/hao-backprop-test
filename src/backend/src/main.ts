/**
 * @fileoverview NestJS application bootstrap entry point
 *
 * This module provides the application bootstrap logic for the NestJS
 * Hello World application. It transforms the vanilla Node.js HTTP server
 * creation (index.js + server.js) into NestJS's NestFactory bootstrap.
 *
 * @module main
 *
 * @description
 * The main.ts file is the entry point for the NestJS application.
 * It performs the following critical functions:
 *
 * - Creates the NestJS application using NestFactory.create(AppModule)
 * - Retrieves configuration from ConfigService for PORT settings
 * - Registers global exception filters for centralized error handling
 * - Enables graceful shutdown handling via app.enableShutdownHooks()
 * - Sets up explicit SIGINT/SIGTERM signal handlers for logging
 * - Starts the HTTP server on the configured port
 *
 * This file replaces the following vanilla Node.js modules:
 * - index.js: The initializeApp() function and main entry point
 * - server.js: The createServer(), startServer(), and setupGracefulShutdown() functions
 *
 * The transformation follows NestJS best practices:
 * - Uses dependency injection via ConfigService
 * - Implements proper exception filter pipeline
 * - Enables NestJS lifecycle hooks for graceful shutdown
 * - Maintains full backward compatibility with original API behavior
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/first-steps NestJS First Steps}
 * @see {@link https://docs.nestjs.com/fundamentals/lifecycle-events NestJS Lifecycle Events}
 * @see {@link https://docs.nestjs.com/exception-filters NestJS Exception Filters}
 *
 * @example
 * // Start the application in development mode
 * npm run start:dev
 *
 * @example
 * // Start the application in production mode
 * npm run start:prod
 *
 * @example
 * // The application responds to graceful shutdown signals
 * // Ctrl+C (SIGINT) or kill command (SIGTERM) will trigger graceful shutdown
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS Core, NestJS Config, Application Modules
 *
 * Import organization follows NestJS best practices:
 * 1. NestJS framework imports (external packages)
 * 2. Application module imports (internal modules)
 * 3. Exception filter imports (internal filters)
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Core Imports
// -----------------------------------------------------------------------------
/**
 * NestFactory is the core entry point for creating NestJS applications.
 * It replaces the vanilla Node.js http.createServer() pattern with a
 * fully-featured application factory that handles:
 * - Dependency injection container initialization
 * - Module instantiation and lifecycle management
 * - HTTP server creation and configuration
 */
import { NestFactory } from '@nestjs/core';

/**
 * Logger is NestJS's built-in logging service that provides:
 * - Context-aware logging with class names
 * - Configurable log levels
 * - Consistent formatting across the application
 *
 * This replaces the custom logger.js module from the original implementation,
 * providing better integration with NestJS's lifecycle and ecosystem.
 */
import { Logger } from '@nestjs/common';

// -----------------------------------------------------------------------------
// NestJS Configuration Imports
// -----------------------------------------------------------------------------
/**
 * ConfigService provides type-safe access to environment configuration.
 * It replaces the vanilla Node.js config.js module with NestJS's
 * configuration management that supports:
 * - Environment variable loading
 * - Default value fallbacks
 * - Type coercion for configuration values
 */
import { ConfigService } from '@nestjs/config';

// -----------------------------------------------------------------------------
// Application Module Import
// -----------------------------------------------------------------------------
/**
 * AppModule is the root application module that orchestrates all feature modules.
 * It replaces the manual module requires from index.js with NestJS's
 * declarative module system. The module hierarchy:
 * - AppModule (root)
 *   - AppConfigModule (configuration management)
 *   - HelloModule (hello endpoint feature)
 */
import { AppModule } from './app.module';

// -----------------------------------------------------------------------------
// Exception Filters Import
// -----------------------------------------------------------------------------
/**
 * AllExceptionsFilter is the catch-all exception filter that handles
 * all unhandled exceptions in the application. It replaces the
 * handleRequestError() and handleServerError() functions from
 * the original errorHandler.js module.
 *
 * This filter ensures:
 * - All exceptions are caught and logged
 * - Consistent 500 error responses for unhandled errors
 * - Sensitive error details are not exposed to clients
 */
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/* ============================================================================
 * CONSTANTS
 * ============================================================================
 * Application bootstrap constants for configuration and logging
 * ============================================================================ */

/**
 * Default port to use if PORT environment variable is not set.
 *
 * @constant {number}
 *
 * @description
 * This default value (3000) matches the original config.js DEFAULT_PORT value
 * to maintain backward compatibility with existing deployments and Docker
 * configurations that may not explicitly set the PORT environment variable.
 */
const DEFAULT_PORT = 3000;

/**
 * Application context name for bootstrap logging.
 *
 * @constant {string}
 *
 * @description
 * Used by the Logger to identify log sources during application startup.
 * All bootstrap-related log entries will be prefixed with this context,
 * making it easy to filter and identify startup logs.
 */
const APP_CONTEXT = 'Bootstrap';

/**
 * Application name for logging and identification.
 *
 * @constant {string}
 *
 * @description
 * Human-readable application name used in startup and shutdown log messages.
 * Provides clear identification of the application in log aggregation systems.
 */
const APP_NAME = 'Hello World NestJS';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 * Type definitions for NestJS application instance
 * ============================================================================ */

/**
 * Import type for NestJS application instance.
 *
 * @description
 * The INestApplication interface provides type safety for the application
 * instance returned by NestFactory.create(). This enables proper autocomplete
 * and type checking for app methods like listen(), close(), and enableShutdownHooks().
 */
import type { INestApplication } from '@nestjs/common';

/* ============================================================================
 * GLOBAL VARIABLES
 * ============================================================================
 * Module-level variables for application state management
 * ============================================================================ */

/**
 * Module-level reference to the NestJS application instance.
 *
 * @description
 * This variable holds a reference to the running application instance,
 * which is needed by the signal handlers to properly close the application
 * during graceful shutdown. Without this reference, the signal handlers
 * would not be able to call app.close().
 *
 * Set to undefined initially and assigned in the bootstrap() function
 * after the application is successfully created.
 */
let app: INestApplication | undefined;

/* ============================================================================
 * SHUTDOWN SIGNAL HANDLERS
 * ============================================================================
 * Signal handlers for graceful application shutdown
 *
 * These handlers replace the setupGracefulShutdown() function from server.js
 * and provide explicit logging for shutdown events, which is important for
 * debugging and monitoring in production environments.
 * ============================================================================ */

/**
 * Handle SIGINT signal for graceful shutdown (Ctrl+C).
 *
 * @async
 * @function handleSigint
 *
 * @description
 * This handler is invoked when the process receives a SIGINT signal,
 * typically from pressing Ctrl+C in the terminal. It performs:
 * 1. Logs the shutdown initiation
 * 2. Gracefully closes the NestJS application
 * 3. Exits the process with success code (0)
 *
 * This replaces the process.on('SIGINT', ...) handler from server.js
 * setupGracefulShutdown() function.
 *
 * @returns {Promise<void>} Resolves when shutdown is complete
 */
async function handleSigint(): Promise<void> {
  // Create a logger instance for shutdown logging
  const logger = new Logger(APP_CONTEXT);

  // Log the signal receipt - matches original server.js logging
  logger.log('Received SIGINT signal. Shutting down gracefully...');

  try {
    // Close the application if it exists and is running
    // The app.close() method triggers NestJS lifecycle hooks:
    // - onModuleDestroy() on all modules
    // - beforeApplicationShutdown() signal-aware hooks
    // - onApplicationShutdown() final cleanup hooks
    if (app) {
      await app.close();
      logger.log('Application closed successfully');
    }

    // Exit with success code - indicates clean shutdown
    process.exit(0);
  } catch (error) {
    // Log any errors that occur during shutdown
    logger.error('Error during SIGINT shutdown:', error);

    // Exit with error code - indicates shutdown failure
    process.exit(1);
  }
}

/**
 * Handle SIGTERM signal for graceful shutdown (termination request).
 *
 * @async
 * @function handleSigterm
 *
 * @description
 * This handler is invoked when the process receives a SIGTERM signal,
 * typically from container orchestrators (Docker, Kubernetes) or
 * process managers (systemd, PM2) when stopping the service.
 *
 * The SIGTERM handler performs the same graceful shutdown as SIGINT:
 * 1. Logs the shutdown initiation
 * 2. Gracefully closes the NestJS application
 * 3. Exits the process with success code (0)
 *
 * This replaces the process.on('SIGTERM', ...) handler from server.js
 * setupGracefulShutdown() function.
 *
 * @returns {Promise<void>} Resolves when shutdown is complete
 */
async function handleSigterm(): Promise<void> {
  // Create a logger instance for shutdown logging
  const logger = new Logger(APP_CONTEXT);

  // Log the signal receipt - matches original server.js logging
  logger.log('Received SIGTERM signal. Shutting down gracefully...');

  try {
    // Close the application if it exists and is running
    // The app.close() method triggers NestJS lifecycle hooks:
    // - onModuleDestroy() on all modules
    // - beforeApplicationShutdown() signal-aware hooks
    // - onApplicationShutdown() final cleanup hooks
    if (app) {
      await app.close();
      logger.log('Application closed successfully');
    }

    // Exit with success code - indicates clean shutdown
    process.exit(0);
  } catch (error) {
    // Log any errors that occur during shutdown
    logger.error('Error during SIGTERM shutdown:', error);

    // Exit with error code - indicates shutdown failure
    process.exit(1);
  }
}

/* ============================================================================
 * BOOTSTRAP FUNCTION
 * ============================================================================
 * Main application bootstrap logic that creates and starts the NestJS app
 * ============================================================================ */

/**
 * Bootstrap the NestJS application.
 *
 * @async
 * @function bootstrap
 *
 * @description
 * This is the main application bootstrap function that initializes and starts
 * the NestJS application. It performs the complete application lifecycle setup:
 *
 * 1. **Application Creation**: Creates the NestJS application instance using
 *    NestFactory.create(AppModule), which initializes the dependency injection
 *    container and instantiates all modules.
 *
 * 2. **Configuration Retrieval**: Gets the ConfigService to access environment
 *    configuration, particularly the PORT setting.
 *
 * 3. **Exception Filter Registration**: Registers global exception filters
 *    for centralized error handling across all routes.
 *
 * 4. **Shutdown Hooks**: Enables NestJS shutdown hooks for proper lifecycle
 *    management during application termination.
 *
 * 5. **Signal Handlers**: Registers process signal handlers for SIGINT and
 *    SIGTERM to provide explicit shutdown logging.
 *
 * 6. **Server Start**: Starts the HTTP server listening on the configured port.
 *
 * This function transforms the original vanilla Node.js patterns:
 * - index.js initializeApp() → bootstrap()
 * - server.js createServer() → NestFactory.create()
 * - server.js startServer() → app.listen()
 * - server.js setupGracefulShutdown() → app.enableShutdownHooks() + signal handlers
 *
 * Error Handling:
 * - All startup errors are caught by the try/catch block
 * - Errors are logged using NestJS Logger
 * - Process exits with code 1 on fatal errors
 *
 * @returns {Promise<void>} Resolves when application is successfully listening
 *
 * @throws {Error} If application fails to start - caught internally and logged
 *
 * @example
 * // This function is automatically called at module load
 * // No manual invocation is needed in normal operation
 *
 * @example
 * // For testing, you can call bootstrap() directly
 * await bootstrap();
 */
async function bootstrap(): Promise<void> {
  // Create a logger instance for bootstrap logging
  // This replaces the custom logger.js from the original implementation
  // with NestJS's built-in Logger that provides context-aware logging
  const logger = new Logger(APP_CONTEXT);

  try {
    // -------------------------------------------------------------------------
    // Step 1: Create the NestJS Application
    // -------------------------------------------------------------------------
    // NestFactory.create() is the NestJS equivalent of http.createServer()
    // from the original server.js. It performs several important tasks:
    //
    // - Instantiates the root AppModule and all imported modules
    // - Builds the dependency injection container
    // - Creates the underlying HTTP server (Express by default)
    // - Registers all controllers and their routes
    // - Sets up all providers for injection
    //
    // The returned app instance provides methods for configuration,
    // middleware registration, and server lifecycle management.
    logger.log(`Creating ${APP_NAME} application...`);
    app = await NestFactory.create(AppModule);

    // -------------------------------------------------------------------------
    // Step 2: Get Configuration Service
    // -------------------------------------------------------------------------
    // Retrieve ConfigService from the dependency injection container
    // to access environment-based configuration values.
    //
    // This replaces the getConfig() function from the original config.js.
    // The ConfigService is provided by AppConfigModule and gives type-safe
    // access to configuration values loaded from environment variables.
    //
    // We use configService.get<number>() to retrieve the port with type
    // coercion and a default fallback value if not set.
    const configService = app.get(ConfigService);

    // Get the port from configuration with default fallback
    // The 'port' key corresponds to the configuration.ts factory export
    const port = configService.get<number>('port', DEFAULT_PORT);

    // Get the environment name for logging
    // Defaults to 'development' if not explicitly set
    const nodeEnv = configService.get<string>('nodeEnv', 'development');

    // -------------------------------------------------------------------------
    // Step 3: Register Global Exception Filters
    // -------------------------------------------------------------------------
    // Register the global exception filter for centralized error handling.
    // This replaces the errorHandler.js module from the original implementation.
    //
    // The AllExceptionsFilter is a catch-all filter that:
    // - Catches all unhandled exceptions in the application
    // - Logs detailed error information for debugging
    // - Returns standardized 500 Internal Server Error responses
    // - Prevents sensitive error details from being exposed
    //
    // Using app.useGlobalFilters() registers the filter globally,
    // meaning it applies to ALL controllers and routes automatically.
    logger.log('Registering global exception filters...');
    app.useGlobalFilters(new AllExceptionsFilter());

    // -------------------------------------------------------------------------
    // Step 4: Enable Shutdown Hooks
    // -------------------------------------------------------------------------
    // Enable NestJS's built-in shutdown hooks for proper lifecycle management.
    // This is part of the graceful shutdown implementation that replaces
    // setupGracefulShutdown() from the original server.js.
    //
    // When shutdown hooks are enabled, NestJS will:
    // - Listen for termination signals (SIGINT, SIGTERM)
    // - Call lifecycle hooks in proper order:
    //   1. onModuleDestroy() - Module cleanup
    //   2. beforeApplicationShutdown() - Pre-shutdown tasks
    //   3. onApplicationShutdown() - Final cleanup
    // - Close all connections and release resources
    //
    // Note: We also register explicit signal handlers below for logging
    // purposes, but enableShutdownHooks() ensures NestJS lifecycle
    // hooks are properly invoked.
    logger.log('Enabling shutdown hooks for graceful termination...');
    app.enableShutdownHooks();

    // -------------------------------------------------------------------------
    // Step 5: Register Signal Handlers
    // -------------------------------------------------------------------------
    // Register explicit process signal handlers for SIGINT and SIGTERM.
    // While NestJS's enableShutdownHooks() handles the actual shutdown,
    // these handlers provide explicit logging for monitoring and debugging.
    //
    // This matches the behavior of setupGracefulShutdown() from server.js,
    // which logged messages when signals were received.
    //
    // SIGINT: Sent when user presses Ctrl+C
    // SIGTERM: Sent by container orchestrators or process managers
    logger.log('Registering signal handlers for SIGINT and SIGTERM...');
    process.on('SIGINT', handleSigint);
    process.on('SIGTERM', handleSigterm);

    // -------------------------------------------------------------------------
    // Step 6: Start the HTTP Server
    // -------------------------------------------------------------------------
    // Start the HTTP server listening on the configured port.
    // This replaces startServer() from the original server.js.
    //
    // The app.listen() method:
    // - Binds the HTTP server to the specified port
    // - Returns a Promise that resolves when the server is ready
    // - Throws an error if the port is already in use
    //
    // The server listens on all network interfaces (0.0.0.0) by default,
    // which is appropriate for containerized deployments.
    await app.listen(port);

    // -------------------------------------------------------------------------
    // Step 7: Log Successful Startup
    // -------------------------------------------------------------------------
    // Log startup success messages with application details.
    // This matches the logging format from the original server.js MESSAGES.
    //
    // The log messages include:
    // - Application URL for easy access
    // - Environment name for deployment verification
    // - Port number for connection information
    logger.log(`${APP_NAME} is running on: http://localhost:${port}`);
    logger.log(`Environment: ${nodeEnv}`);
    logger.log('Application initialized successfully');
  } catch (error) {
    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    // Catch and handle any errors that occur during application bootstrap.
    // This replaces the error handling in the original index.js main() function.
    //
    // Common startup errors include:
    // - Port already in use (EADDRINUSE)
    // - Configuration validation failures
    // - Module instantiation errors
    // - Database connection failures (if applicable)
    //
    // All errors are logged with full details for debugging, then the
    // process exits with code 1 to indicate startup failure.
    const logger = new Logger(APP_CONTEXT);
    logger.error('Failed to initialize application:');
    logger.error(error instanceof Error ? error.message : String(error));

    // Log stack trace for debugging if available
    if (error instanceof Error && error.stack) {
      logger.error(error.stack);
    }

    // Exit with error code to indicate startup failure
    // This matches the original process.exit(1) behavior from index.js
    // and ensures container orchestrators know the application failed
    process.exit(1);
  }
}

/* ============================================================================
 * APPLICATION STARTUP
 * ============================================================================
 * Invoke the bootstrap function to start the application
 *
 * This section is equivalent to the main() call at the end of the original
 * index.js file. The bootstrap() function is called immediately when this
 * module is loaded, starting the NestJS application.
 * ============================================================================ */

// Start the application by calling the bootstrap function
// This is the entry point when running: node dist/main.js
// or when using: npm run start / npm run start:prod
bootstrap();
