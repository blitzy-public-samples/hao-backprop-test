/**
 * @fileoverview Catch-all exception filter for unhandled errors
 *
 * This module provides a global exception filter that catches all exceptions
 * not handled by more specific exception filters in the NestJS application.
 * It ensures that no unhandled exceptions leak out to the client with
 * sensitive information, instead returning a standardized 500 Internal Server
 * Error response.
 *
 * @module AllExceptionsFilter
 *
 * @description
 * The AllExceptionsFilter implements NestJS's ExceptionFilter interface with
 * the @Catch() decorator used without arguments, which means it catches ANY
 * exception type that bubbles up through the application. This is the last
 * line of defense in the exception handling pipeline.
 *
 * Key responsibilities:
 * - Catch all unhandled exceptions regardless of type
 * - Log detailed error information for debugging and monitoring
 * - Return a safe, standardized 500 response to the client
 * - Prevent sensitive error details from being exposed
 *
 * This filter transforms the functionality from the original errorHandler.js
 * module's handleRequestError() and handleServerError() functions into the
 * NestJS exception filter pattern.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/exception-filters NestJS Exception Filters}
 * @see {@link https://docs.nestjs.com/exception-filters#catch-everything Catch Everything}
 *
 * @example
 * // Register globally in main.ts for application-wide coverage
 * import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   // Register the catch-all filter globally
 *   // This ensures ALL unhandled exceptions are caught
 *   app.useGlobalFilters(new AllExceptionsFilter());
 *
 *   await app.listen(3000);
 * }
 *
 * @example
 * // The filter can also be provided via dependency injection
 * import { APP_FILTER } from '@nestjs/core';
 *
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: AllExceptionsFilter,
 *     },
 *   ],
 * })
 * export class AppModule {}
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, Express types, local modules
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// Core decorators and interfaces for exception filter implementation
import {
  ExceptionFilter, // Interface that all exception filters must implement
  Catch, // Decorator that marks a class as an exception filter
  ArgumentsHost, // Provides access to request/response context
  HttpStatus, // Enum containing HTTP status code constants
  Logger, // NestJS built-in logger for consistent application logging
} from '@nestjs/common';

// -----------------------------------------------------------------------------
// Express Type Imports
// -----------------------------------------------------------------------------
// Type definitions for Express request and response objects
// These are used for type-safe access to HTTP context
import { Response, Request } from 'express';

// -----------------------------------------------------------------------------
// Local Module Imports
// -----------------------------------------------------------------------------
// Application constants for consistent messaging
import { MESSAGES } from '../constants';

/* ============================================================================
 * CONSTANTS
 * ============================================================================
 * Local constants used within this filter
 * ============================================================================ */

/**
 * Content-Type header value for plain text responses
 * Used to set the response content type to text/plain as required
 * by the API contract for error responses
 */
const CONTENT_TYPE_TEXT = 'text/plain';

/**
 * Content-Type header name
 * Standard HTTP header for specifying the media type of the response body
 */
const CONTENT_TYPE_HEADER = 'Content-Type';

/* ============================================================================
 * ALL EXCEPTIONS FILTER CLASS
 * ============================================================================
 * Global exception filter that catches all unhandled exceptions
 * ============================================================================ */

/**
 * Global exception filter that catches ALL unhandled exceptions
 *
 * @class AllExceptionsFilter
 *
 * @description
 * This filter serves as the application's last line of defense against
 * unhandled exceptions. It implements the NestJS ExceptionFilter interface
 * and uses the @Catch() decorator WITHOUT arguments, which is a special
 * NestJS pattern that means "catch everything".
 *
 * When an exception is not caught by any more specific filter (like
 * HttpExceptionFilter), it bubbles up to this filter. This ensures:
 *
 * 1. No unhandled exceptions crash the application
 * 2. All errors return a consistent 500 response format
 * 3. Sensitive error details are not exposed to clients
 * 4. All exceptions are logged for debugging purposes
 *
 * The filter transforms the original errorHandler.js functionality:
 * - handleRequestError() → catch() method with response handling
 * - handleServerError() → error logging functionality
 *
 * @implements {ExceptionFilter}
 *
 * @example
 * // Global registration in main.ts
 * const app = await NestFactory.create(AppModule);
 * app.useGlobalFilters(new AllExceptionsFilter());
 *
 * @example
 * // Module-level registration with dependency injection
 * @Module({
 *   providers: [{
 *     provide: APP_FILTER,
 *     useClass: AllExceptionsFilter,
 *   }],
 * })
 * export class AppModule {}
 *
 * @example
 * // Controller-level registration (if needed for specific controllers)
 * @Controller('api')
 * @UseFilters(new AllExceptionsFilter())
 * export class ApiController {}
 */
@Catch() // Empty @Catch() decorator - catches ALL exception types
export class AllExceptionsFilter implements ExceptionFilter {
  /* --------------------------------------------------------------------------
   * CLASS PROPERTIES
   * --------------------------------------------------------------------------
   * Logger instance for recording exception details
   * -------------------------------------------------------------------------- */

  /**
   * Private logger instance for this filter
   *
   * @private
   * @readonly
   *
   * @description
   * Uses NestJS's built-in Logger class for consistent logging across
   * the application. The logger is initialized with the filter's class
   * name to make log entries easily identifiable in application logs.
   *
   * This replaces the custom logger.js module from the original implementation,
   * leveraging NestJS's integrated logging infrastructure which supports:
   * - Configurable log levels
   * - Contextual logging with class names
   * - Integration with external logging services
   */
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /* --------------------------------------------------------------------------
   * PUBLIC METHODS
   * --------------------------------------------------------------------------
   * Implementation of the ExceptionFilter interface
   * -------------------------------------------------------------------------- */

  /**
   * Catches and handles all unhandled exceptions
   *
   * @method catch
   *
   * @description
   * This method is invoked by NestJS whenever an exception is thrown that
   * hasn't been caught by a more specific exception filter. It performs
   * the following operations:
   *
   * 1. Extracts HTTP context from ArgumentsHost
   * 2. Retrieves request and response objects for processing
   * 3. Logs the exception with full details for debugging
   * 4. Checks if headers have already been sent (prevents duplicate responses)
   * 5. Sends a standardized 500 Internal Server Error response
   *
   * This method transforms the logic from the original errorHandler.js:
   * - handleRequestError(error, res) → catch() method
   * - Error logging with request context
   * - Response headers check before sending
   *
   * @param {unknown} exception - The exception that was thrown
   *   Can be any type: Error object, string, or any thrown value
   *   We use 'unknown' type to properly handle all possible exception types
   *
   * @param {ArgumentsHost} host - NestJS context object providing access
   *   to the underlying platform (Express) request/response objects
   *
   * @returns {void} - This method doesn't return a value; it sends
   *   the HTTP response directly to the client
   *
   * @throws {void} - This method should never throw; it's the last resort
   *   for exception handling
   *
   * @example
   * // This filter is automatically invoked by NestJS when an
   * // unhandled exception occurs in the request pipeline.
   * // No manual invocation is needed.
   *
   * // Example of an exception that would be caught:
   * @Get('data')
   * getData() {
   *   throw new Error('Database connection failed');
   *   // This Error would be caught by AllExceptionsFilter
   *   // and converted to a 500 response
   * }
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // -------------------------------------------------------------------------
    // Extract HTTP Context
    // -------------------------------------------------------------------------
    // The ArgumentsHost is a wrapper that allows us to access the underlying
    // HTTP context (request/response) regardless of the underlying platform
    // (Express, Fastify, etc.). switchToHttp() gives us HTTP-specific methods.
    const ctx = host.switchToHttp();

    // Get the Express response object for sending the error response
    // Using generic type parameter to ensure type safety
    const response = ctx.getResponse<Response>();

    // Get the Express request object for logging request details
    // This helps with debugging by showing which request caused the error
    const request = ctx.getRequest<Request>();

    // -------------------------------------------------------------------------
    // Extract Exception Details for Logging
    // -------------------------------------------------------------------------
    // Since 'exception' can be any type (unknown), we need to safely extract
    // error message and stack trace information for logging purposes

    // Extract the error message, handling different exception types
    // If exception is an Error object, get its message property
    // Otherwise, convert to string for logging
    const errorMessage = exception instanceof Error ? exception.message : String(exception);

    // Extract stack trace if available (only Error objects have stack traces)
    // Stack trace is crucial for debugging production issues
    const stackTrace = exception instanceof Error ? exception.stack : 'No stack trace available';

    // -------------------------------------------------------------------------
    // Log Exception Details
    // -------------------------------------------------------------------------
    // Comprehensive logging for debugging and monitoring purposes
    // This transforms the logger.error() call from original handleRequestError()
    //
    // Log format includes:
    // - Exception message for quick identification
    // - Request method (GET, POST, etc.) to understand context
    // - Request URL to identify which endpoint failed
    // - Stack trace for debugging the root cause
    this.logger.error(
      `Unhandled Exception: ${errorMessage}`,
      stackTrace,
      `${request.method} ${request.url}`,
    );

    // -------------------------------------------------------------------------
    // Check if Headers Already Sent
    // -------------------------------------------------------------------------
    // IMPORTANT: This check prevents the "Cannot set headers after they are
    // sent to the client" error. This can happen if:
    // - A response was partially sent before the exception
    // - Stream responses that started writing
    // - Middleware that already sent a response
    //
    // This preserves the logic from original errorHandler.js lines 23-25:
    // if (res.headersSent) { return; }
    if (response.headersSent) {
      // Log that we couldn't send an error response due to headers already sent
      this.logger.warn(
        'Cannot send error response - headers already sent for ' +
          `${request.method} ${request.url}`,
      );
      // Cannot send error response if headers are already sent
      return;
    }

    // -------------------------------------------------------------------------
    // Send Standardized Error Response
    // -------------------------------------------------------------------------
    // Send a safe, standardized 500 Internal Server Error response
    // This ensures no sensitive information leaks to the client
    //
    // Response format (per API contract in Section 0.6.4):
    // - Status: 500 Internal Server Error
    // - Content-Type: text/plain
    // - Body: 'Internal Server Error'
    //
    // Using the Express response methods in a chain:
    // 1. status() - Sets the HTTP status code
    // 2. set() - Sets the Content-Type header
    // 3. send() - Sends the response body
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR) // HTTP 500
      .set(CONTENT_TYPE_HEADER, CONTENT_TYPE_TEXT) // Content-Type: text/plain
      .send(MESSAGES.SERVER_ERROR); // 'Internal Server Error'
  }
}
