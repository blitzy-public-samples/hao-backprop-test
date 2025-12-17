/**
 * @fileoverview HTTP Exception Filter for NestJS Hello World Application
 *
 * This module provides a centralized exception filter for handling HttpException
 * instances thrown within the NestJS application. It ensures consistent error
 * response formatting across all HTTP error scenarios, maintaining backward
 * compatibility with the original Node.js implementation's error handling behavior.
 *
 * @module common/filters/HttpExceptionFilter
 *
 * @description
 * The HttpExceptionFilter catches all HttpException instances (such as
 * NotFoundException, MethodNotAllowedException, etc.) and formats them into
 * consistent plain text responses. This filter specifically handles:
 *
 * - **404 Not Found**: For unknown routes, returns "Not Found" with text/plain
 * - **405 Method Not Allowed**: For unsupported methods, returns "Method Not Allowed"
 *   with the required Allow header specifying permitted methods
 * - **Other HTTP Exceptions**: Generic handling with appropriate status and message
 *
 * Key Features:
 * - Maintains API contract compatibility with original implementation
 * - Sets Content-Type to text/plain for all error responses
 * - Includes Allow header for 405 responses (RFC 7231 compliance)
 * - Comprehensive logging for debugging and monitoring
 *
 * This filter is distinct from AllExceptionsFilter which catches non-HTTP
 * exceptions. The separation allows for specialized handling of HTTP-specific
 * errors while delegating unexpected errors to a catch-all handler.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/exception-filters NestJS Exception Filters}
 * @see {@link https://tools.ietf.org/html/rfc7231#section-6 RFC 7231 HTTP Status Codes}
 * @see AllExceptionsFilter - For handling non-HTTP exceptions
 *
 * @example
 * // Global registration in main.ts
 * import { HttpExceptionFilter } from './common/filters/http-exception.filter';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   // Register the HTTP exception filter globally
 *   app.useGlobalFilters(new HttpExceptionFilter());
 *
 *   await app.listen(3000);
 * }
 *
 * @example
 * // Throwing exceptions in controllers that will be caught by this filter
 * import { NotFoundException, MethodNotAllowedException } from '@nestjs/common';
 *
 * @Controller('hello')
 * export class HelloController {
 *   @Get()
 *   getHello(): string {
 *     return 'Hello world';
 *   }
 *
 *   // For non-GET methods, NestJS automatically returns 404 for unmatched routes
 *   // To explicitly throw Method Not Allowed:
 *   // throw new MethodNotAllowedException('Method Not Allowed');
 * }
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Import statements are organized into logical groups for maintainability:
 * 1. NestJS framework imports - Core decorators and utilities
 * 2. Express type imports - HTTP request/response types
 * 3. Local application imports - Constants and shared resources
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Core Imports
// -----------------------------------------------------------------------------
// These imports provide the foundation for building NestJS exception filters:
// - ExceptionFilter: Interface that all exception filters must implement
// - Catch: Decorator to specify which exceptions this filter handles
// - ArgumentsHost: Context object providing access to request/response
// - HttpException: Base class for all HTTP-related exceptions
// - HttpStatus: Enum of standard HTTP status codes for comparison
// - Logger: NestJS built-in logging service for structured logging
// -----------------------------------------------------------------------------
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// -----------------------------------------------------------------------------
// Express Type Imports
// -----------------------------------------------------------------------------
// Type definitions for the underlying HTTP layer (Express by default in NestJS)
// - Response: Express response object for sending HTTP responses
// - Request: Express request object for accessing request details
// These types enable type-safe manipulation of HTTP request/response objects
// -----------------------------------------------------------------------------
import { Response, Request } from 'express';

// -----------------------------------------------------------------------------
// Local Application Imports
// -----------------------------------------------------------------------------
// Application-wide constants ensuring consistent error messaging and headers:
// - MESSAGES: Standardized error message strings (NOT_FOUND, METHOD_NOT_ALLOWED)
// - HEADERS: HTTP header names and values (CONTENT_TYPE, ALLOW)
// - HTTP_METHODS: Allowed HTTP methods for the Allow header (GET)
// -----------------------------------------------------------------------------
import { MESSAGES, HEADERS, HTTP_METHODS } from '../constants';

/* ============================================================================
 * HTTP EXCEPTION FILTER CLASS
 * ============================================================================
 * The HttpExceptionFilter class implements the NestJS ExceptionFilter interface
 * to provide centralized handling of HttpException instances. The @Catch
 * decorator with HttpException parameter ensures this filter only catches
 * HTTP-related exceptions, leaving other exception types to be handled by
 * more specific or catch-all filters.
 * ============================================================================ */

/**
 * Exception filter for handling HttpException instances with consistent
 * error response formatting
 *
 * @class HttpExceptionFilter
 *
 * @description
 * This filter intercepts all HttpException instances thrown during request
 * processing and transforms them into consistent plain text error responses.
 * It maintains backward compatibility with the original Node.js implementation's
 * error response format.
 *
 * The filter handles specific HTTP status codes with specialized logic:
 * - **404 Not Found**: Occurs when no route matches the request path
 * - **405 Method Not Allowed**: Occurs when an unsupported HTTP method is used
 *
 * For all other HTTP exceptions, it provides generic handling while maintaining
 * the consistent response format.
 *
 * @implements {ExceptionFilter<HttpException>}
 *
 * @example
 * // Registering the filter globally in main.ts
 * import { NestFactory } from '@nestjs/core';
 * import { HttpExceptionFilter } from './common/filters/http-exception.filter';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *
 *   // Apply filter globally to catch all HttpException instances
 *   app.useGlobalFilters(new HttpExceptionFilter());
 *
 *   await app.listen(3000);
 * }
 *
 * @example
 * // How exceptions are caught from controller methods
 * @Controller('example')
 * export class ExampleController {
 *   @Get(':id')
 *   findOne(@Param('id') id: string) {
 *     if (!resource) {
 *       // This NotFoundException will be caught by HttpExceptionFilter
 *       throw new NotFoundException('Resource not found');
 *     }
 *   }
 * }
 *
 * @example
 * // Response format for 404 Not Found
 * // HTTP/1.1 404 Not Found
 * // Content-Type: text/plain
 * //
 * // Not Found
 *
 * @example
 * // Response format for 405 Method Not Allowed
 * // HTTP/1.1 405 Method Not Allowed
 * // Content-Type: text/plain
 * // Allow: GET
 * //
 * // Method Not Allowed
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  /**
   * Logger instance for recording exception details
   *
   * @private
   * @readonly
   * @description
   * Uses NestJS's built-in Logger service for structured logging.
   * The logger is scoped to this filter's class name for easy identification
   * in log output. This replaces the custom logger from the original
   * implementation with NestJS's standardized logging approach.
   *
   * Log levels used:
   * - log(): Informational messages for 404/405 responses (mirrors original logger.info)
   * - warn(): Warning for unusual HTTP exceptions that might need attention
   */
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catches and handles HttpException instances thrown during request processing
   *
   * @method catch
   *
   * @description
   * This method is called by the NestJS framework whenever an HttpException
   * (or any of its subclasses) is thrown and not caught elsewhere. It extracts
   * the HTTP context from the ArgumentsHost, determines the appropriate response
   * format based on the status code, and sends a properly formatted error response.
   *
   * The method handles three categories of HTTP exceptions:
   *
   * 1. **404 Not Found** (HttpStatus.NOT_FOUND)
   *    - Sets status code to 404
   *    - Sets Content-Type to text/plain
   *    - Sends "Not Found" message body
   *    - Logs the response for debugging
   *
   * 2. **405 Method Not Allowed** (HttpStatus.METHOD_NOT_ALLOWED)
   *    - Sets status code to 405
   *    - Sets Content-Type to text/plain
   *    - **CRITICAL**: Sets Allow header to "GET" per RFC 7231 Section 6.5.5
   *    - Sends "Method Not Allowed" message body
   *    - Logs the response for debugging
   *
   * 3. **Other HTTP Exceptions**
   *    - Uses the exception's status code
   *    - Sets Content-Type to text/plain
   *    - Sends the exception message as response body
   *    - Logs a warning for unexpected HTTP exceptions
   *
   * This method preserves the API contract from the original Node.js
   * implementation, ensuring backward compatibility for all clients.
   *
   * @param {HttpException} exception - The HttpException instance that was thrown.
   *   Contains the HTTP status code and response message to return.
   *
   * @param {ArgumentsHost} host - NestJS context object providing access to the
   *   underlying HTTP request and response objects. Used to switch to HTTP
   *   context and retrieve Express Request/Response objects.
   *
   * @returns {void} This method does not return a value. It directly sends
   *   the HTTP response through the Express Response object.
   *
   * @throws This method does not throw exceptions. All errors are handled
   *   internally and logged appropriately.
   *
   * @example
   * // When a NotFoundException is thrown:
   * throw new NotFoundException();
   * // This filter catches it and responds:
   * // HTTP/1.1 404 Not Found
   * // Content-Type: text/plain
   * //
   * // Not Found
   *
   * @example
   * // When a MethodNotAllowedException is thrown:
   * throw new MethodNotAllowedException();
   * // This filter catches it and responds:
   * // HTTP/1.1 405 Method Not Allowed
   * // Content-Type: text/plain
   * // Allow: GET
   * //
   * // Method Not Allowed
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    // -------------------------------------------------------------------------
    // Extract HTTP Context
    // -------------------------------------------------------------------------
    // Switch to HTTP context to access Express Request/Response objects.
    // NestJS supports multiple execution contexts (HTTP, WebSocket, RPC),
    // so we must explicitly switch to HTTP to get web request objects.
    // -------------------------------------------------------------------------
    const ctx = host.switchToHttp();

    // Get the Express Response object for sending the HTTP response
    const response = ctx.getResponse<Response>();

    // Get the Express Request object for logging request details
    const request = ctx.getRequest<Request>();

    // -------------------------------------------------------------------------
    // Extract Exception Details
    // -------------------------------------------------------------------------
    // Retrieve the HTTP status code and response body from the exception.
    // HttpException.getStatus() returns the numeric HTTP status code.
    // HttpException.getResponse() returns the response body (string or object).
    // -------------------------------------------------------------------------
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // -------------------------------------------------------------------------
    // Determine Response Message
    // -------------------------------------------------------------------------
    // The exception response can be either a string or an object.
    // For object responses (common with built-in NestJS exceptions),
    // extract the 'message' property. Fall back to exception.message if needed.
    // -------------------------------------------------------------------------
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? String(
              (exceptionResponse as Record<string, unknown>).message,
            )
          : exception.message;

    // -------------------------------------------------------------------------
    // Handle 404 Not Found
    // -------------------------------------------------------------------------
    // When the status code is 404, send a standardized "Not Found" response.
    // This mirrors the original handle404() function from errorHandler.js:
    //   - Sets status code to 404
    //   - Sets Content-Type to text/plain
    //   - Sends "Not Found" message
    //   - Logs the response
    // -------------------------------------------------------------------------
    if (status === HttpStatus.NOT_FOUND) {
      // Log the 404 response with request details for debugging
      // Format matches original: "Responding with 404 Not Found"
      this.logger.log(
        `Responding with 404 Not Found - ${request.method} ${request.url}`,
      );

      // Send the 404 response with proper headers and body
      response
        .status(HttpStatus.NOT_FOUND)
        .set(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT)
        .send(MESSAGES.NOT_FOUND);

      return;
    }

    // -------------------------------------------------------------------------
    // Handle 405 Method Not Allowed
    // -------------------------------------------------------------------------
    // When the status code is 405, send a standardized "Method Not Allowed"
    // response with the required Allow header.
    //
    // CRITICAL: Per RFC 7231 Section 6.5.5, 405 responses MUST include an
    // Allow header field containing a list of valid methods for the resource.
    // For this application, only GET is allowed on the /hello endpoint.
    //
    // This mirrors the original handle405() function from errorHandler.js:
    //   - Sets status code to 405
    //   - Sets Content-Type to text/plain
    //   - Sets Allow header to "GET" (REQUIRED per API contract)
    //   - Sends "Method Not Allowed" message
    //   - Logs the response
    // -------------------------------------------------------------------------
    if (status === HttpStatus.METHOD_NOT_ALLOWED) {
      // Log the 405 response with request details for debugging
      // Format matches original: "Responding with 405 Method Not Allowed"
      this.logger.log(
        `Responding with 405 Method Not Allowed - ${request.method} ${request.url}`,
      );

      // Send the 405 response with proper headers and body
      // The Allow header is REQUIRED per Section 0.6.4 of the spec
      response
        .status(HttpStatus.METHOD_NOT_ALLOWED)
        .set(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT)
        .set(HEADERS.ALLOW, HTTP_METHODS.GET)
        .send(MESSAGES.METHOD_NOT_ALLOWED);

      return;
    }

    // -------------------------------------------------------------------------
    // Handle Other HTTP Exceptions
    // -------------------------------------------------------------------------
    // For any other HTTP exception status codes (e.g., 400 Bad Request,
    // 401 Unauthorized, 403 Forbidden, etc.), provide generic handling
    // while maintaining the consistent plain text response format.
    //
    // This ensures all HTTP errors are formatted consistently, even if
    // they aren't explicitly handled above. The exception's message is
    // used directly as the response body.
    // -------------------------------------------------------------------------

    // Log a warning for unexpected HTTP exceptions that might need attention
    // This helps identify edge cases that may need specialized handling
    this.logger.warn(
      `HTTP Exception ${status}: ${message} - ${request.method} ${request.url}`,
    );

    // Send the response with the exception's status and message
    // Content-Type is set to text/plain for consistency with other responses
    response
      .status(status)
      .set(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT)
      .send(message);
  }
}
