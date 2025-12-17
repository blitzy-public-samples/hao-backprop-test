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
 * It performs the following functions:
 *
 * - Creates the NestJS application using NestFactory
 * - Retrieves configuration from ConfigService
 * - Registers global exception filters
 * - Enables graceful shutdown handling
 * - Starts the HTTP server on the configured port
 *
 * This file replaces:
 * - index.js: The initializeApp() function and main entry
 * - server.js: The createServer() and startServer() functions
 * - server.js: The setupGracefulShutdown() function
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/first-steps NestJS First Steps}
 * @see {@link https://docs.nestjs.com/fundamentals/lifecycle-events NestJS Lifecycle Events}
 *
 * @example
 * // Start the application
 * npm run start
 *
 * // Start in development mode with hot reload
 * npm run start:dev
 *
 * // Start in production mode
 * npm run start:prod
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, local modules
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Core Imports
// -----------------------------------------------------------------------------
// NestFactory for creating the application instance
import { NestFactory } from '@nestjs/core';

// NestJS Common utilities for logging
import { Logger } from '@nestjs/common';

// -----------------------------------------------------------------------------
// NestJS Configuration Imports
// -----------------------------------------------------------------------------
// ConfigService for accessing environment configuration
import { ConfigService } from '@nestjs/config';

// -----------------------------------------------------------------------------
// Application Module Import
// -----------------------------------------------------------------------------
// Root application module containing all feature modules
import { AppModule } from './app.module';

// -----------------------------------------------------------------------------
// Exception Filters Import
// -----------------------------------------------------------------------------
// Global exception filters for centralized error handling
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/* ============================================================================
 * CONSTANTS
 * ============================================================================
 * Application bootstrap constants
 * ============================================================================ */

/**
 * Default port to use if PORT environment variable is not set
 * Matches the original config.js DEFAULT_PORT value
 */
const DEFAULT_PORT = 3000;

/**
 * Application context name for logging
 * Used by the Logger to identify log sources
 */
const APP_CONTEXT = 'Bootstrap';

/* ============================================================================
 * BOOTSTRAP FUNCTION
 * ============================================================================
 * Main application bootstrap logic
 * ============================================================================ */

/**
 * Bootstrap the NestJS application
 *
 * @async
 * @function bootstrap
 *
 * @description
 * This function initializes and starts the NestJS application. It performs
 * the complete application lifecycle setup:
 *
 * 1. Creates the NestJS application with AppModule
 * 2. Retrieves ConfigService for environment configuration
 * 3. Registers global exception filters for error handling
 * 4. Enables shutdown hooks for graceful termination
 * 5. Starts listening on the configured port
 *
 * This function transforms the original index.js initializeApp() function
 * and server.js createServer()/startServer() functions into NestJS patterns.
 *
 * Error handling:
 * - All startup errors are caught and logged
 * - Process exits with code 1 on fatal errors
 *
 * Graceful shutdown:
 * - SIGINT (Ctrl+C) triggers graceful shutdown
 * - SIGTERM triggers graceful shutdown
 * - All connections are properly closed before exit
 *
 * @returns {Promise<void>} Resolves when application is listening
 *
 * @throws {Error} If application fails to start (caught internally)
 *
 * @example
 * // This function is automatically called at module load
 * // No manual invocation needed
 */
async function bootstrap(): Promise<void> {
  // Create a logger instance for bootstrap logging
  // This replaces the custom logger.js from the original implementation
  const logger = new Logger(APP_CONTEXT);

  try {
    // -------------------------------------------------------------------------
    // Step 1: Create the NestJS Application
    // -------------------------------------------------------------------------
    // NestFactory.create() replaces http.createServer() from server.js
    // It initializes the dependency injection container, instantiates all
    // modules, and creates the underlying HTTP server
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule);

    // -------------------------------------------------------------------------
    // Step 2: Get Configuration Service
    // -------------------------------------------------------------------------
    // Retrieve ConfigService to access environment configuration
    // This replaces the getConfig() function from config.js
    const configService = app.get(ConfigService);
    const port = configService.get<number>('port', DEFAULT_PORT);

    // -------------------------------------------------------------------------
    // Step 3: Register Global Exception Filters
    // -------------------------------------------------------------------------
    // Register exception filters for centralized error handling
    // This replaces the errorHandler.js module functions
    //
    // Order matters: HttpExceptionFilter first, AllExceptionsFilter as fallback
    // - HttpExceptionFilter handles known HTTP exceptions (404, 405, etc.)
    // - AllExceptionsFilter catches all other unhandled exceptions (500)
    logger.log('Registering global exception filters...');
    app.useGlobalFilters(
      new AllExceptionsFilter(), // Catch-all filter for unhandled exceptions
      new HttpExceptionFilter(), // Specific filter for HTTP exceptions
    );

    // -------------------------------------------------------------------------
    // Step 4: Enable Shutdown Hooks
    // -------------------------------------------------------------------------
    // Enable graceful shutdown handling for SIGINT and SIGTERM signals
    // This replaces setupGracefulShutdown() from server.js
    //
    // NestJS shutdown hooks:
    // - onModuleDestroy(): Called when a module is being destroyed
    // - beforeApplicationShutdown(): Called right before shutdown
    // - onApplicationShutdown(): Called when app is shutting down
    logger.log('Enabling shutdown hooks for graceful termination...');
    app.enableShutdownHooks();

    // -------------------------------------------------------------------------
    // Step 5: Start the HTTP Server
    // -------------------------------------------------------------------------
    // Start listening on the configured port
    // This replaces startServer() from server.js
    await app.listen(port);

    // Log successful startup
    // This matches the original logging format from server.js
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Environment: ${configService.get('nodeEnv', 'development')}`);
  } catch (error) {
    // -------------------------------------------------------------------------
    // Error Handling
    // -------------------------------------------------------------------------
    // Log fatal errors and exit with failure code
    // This replaces the error handling in index.js main() function
    const logger = new Logger(APP_CONTEXT);
    logger.error('Failed to initialize application:', error);

    // Exit with error code to indicate startup failure
    // This matches the original process.exit(1) behavior from index.js
    process.exit(1);
  }
}

/* ============================================================================
 * APPLICATION STARTUP
 * ============================================================================
 * Invoke the bootstrap function to start the application
 * ============================================================================ */

// Start the application
// This is equivalent to the main() call at the end of original index.js
bootstrap();
