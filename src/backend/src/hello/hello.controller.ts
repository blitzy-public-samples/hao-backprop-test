/**
 * @fileoverview Hello endpoint controller for NestJS application
 *
 * This module provides the HTTP request handling for the /hello endpoint,
 * transforming the vanilla Node.js handleHelloRequest() function from
 * handlers/helloHandler.js into a NestJS decorator-based controller.
 *
 * @module HelloController
 *
 * @description
 * The HelloController handles all HTTP requests to the /hello endpoint
 * using NestJS's decorator-based routing system. It replaces:
 *
 * - Manual URL parsing from router.js
 * - The handleHelloRequest(req, res) function from helloHandler.js
 * - Manual HTTP status code and header setting
 *
 * Key features:
 * - @Controller('hello') decorator for route registration
 * - @Get() decorator for handling GET requests only
 * - Automatic 405 Method Not Allowed for non-GET methods (NestJS built-in)
 * - Dependency injection of HelloService for business logic
 * - Proper Content-Type header handling
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/controllers NestJS Controllers}
 * @see {@link https://docs.nestjs.com/techniques/mvc NestJS MVC Pattern}
 *
 * @example
 * // GET request to /hello returns "Hello world"
 * curl http://localhost:3000/hello
 * // Response: Hello world (200 OK)
 *
 * @example
 * // POST request to /hello returns 405 Method Not Allowed
 * curl -X POST http://localhost:3000/hello
 * // Response: Method Not Allowed (405)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, local modules
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// HTTP decorators and utilities for controller implementation
import {
  Controller, // Decorator defining this class as an HTTP controller
  Get, // Decorator for handling HTTP GET requests
  Logger, // NestJS built-in logger for consistent logging
  Header, // Decorator for setting response headers
  HttpCode, // Decorator for setting HTTP status code
  HttpStatus, // Enum containing HTTP status code constants
} from '@nestjs/common';

// -----------------------------------------------------------------------------
// Local Service Imports
// -----------------------------------------------------------------------------
// Business logic service for the hello endpoint
import { HelloService } from './hello.service';

// -----------------------------------------------------------------------------
// Data Transfer Objects (DTOs)
// -----------------------------------------------------------------------------
// Type-safe response structure for API documentation and type annotations
// Note: This import is optional and used for documentation purposes.
// The controller returns a plain string for backward compatibility with
// the original helloHandler.js implementation (res.end(MESSAGES.HELLO_RESPONSE))
import { HelloResponseDto } from './dto/hello-response.dto';

/* ============================================================================
 * HELLO CONTROLLER CLASS
 * ============================================================================
 * HTTP controller for the /hello endpoint
 * ============================================================================ */

/**
 * Controller class handling HTTP requests to the /hello endpoint
 *
 * @class HelloController
 *
 * @description
 * This controller handles all HTTP traffic to the /hello route, implementing
 * the NestJS controller pattern with decorator-based routing. It transforms
 * the manual HTTP request handling from the original handlers/helloHandler.js
 * into a clean, declarative approach.
 *
 * The controller:
 * - Registers the '/hello' route via @Controller('hello')
 * - Handles GET requests via @Get() decorator
 * - Delegates business logic to HelloService
 * - Automatically rejects non-GET methods with 405 (NestJS default behavior)
 *
 * This replaces:
 * - router.js: Manual URL path matching and routing
 * - helloHandler.js: The handleHelloRequest(req, res) function
 * - errorHandler.js: The handle405(res) function (now automatic)
 *
 * @example
 * // GET /hello request flow:
 * // 1. NestJS routes request to HelloController
 * // 2. @Get() decorated method getHello() is invoked
 * // 3. HelloService.getHello() returns "Hello world"
 * // 4. Response sent with 200 OK status
 *
 * @example
 * // POST /hello request flow (automatic 405):
 * // 1. NestJS receives POST /hello
 * // 2. No POST handler found in controller
 * // 3. NestJS automatically returns 405 Method Not Allowed
 */
@Controller('hello') // Registers this controller for /hello route
export class HelloController {
  /* --------------------------------------------------------------------------
   * CLASS PROPERTIES
   * --------------------------------------------------------------------------
   * Logger and service dependencies
   * -------------------------------------------------------------------------- */

  /**
   * Private logger instance for this controller
   *
   * @private
   * @readonly
   *
   * @description
   * Uses NestJS's built-in Logger class for consistent logging across
   * the application. Replaces the custom logger.js module from the
   * original implementation.
   */
  private readonly logger = new Logger(HelloController.name);

  /* --------------------------------------------------------------------------
   * CONSTRUCTOR
   * --------------------------------------------------------------------------
   * Dependency injection of HelloService
   * -------------------------------------------------------------------------- */

  /**
   * Constructs the HelloController with injected dependencies
   *
   * @constructor
   *
   * @param {HelloService} helloService - Service providing hello business logic
   *
   * @description
   * The constructor uses NestJS dependency injection to receive the
   * HelloService instance. This pattern:
   *
   * - Replaces manual require() imports from vanilla Node.js
   * - Enables easy mocking for unit tests
   * - Promotes loose coupling between controller and service
   *
   * The 'private readonly' modifier automatically creates and assigns
   * the service as a class property, a TypeScript shorthand.
   */
  constructor(private readonly helloService: HelloService) {
    // Log controller initialization for debugging
    this.logger.log('HelloController initialized');
  }

  /* --------------------------------------------------------------------------
   * HTTP ENDPOINT HANDLERS
   * --------------------------------------------------------------------------
   * Methods decorated with HTTP method decorators
   * -------------------------------------------------------------------------- */

  /**
   * Handles GET requests to the /hello endpoint
   *
   * @method getHello
   *
   * @description
   * This method handles HTTP GET requests to the /hello endpoint.
   * It replaces the original handleHelloRequest() function from
   * helloHandler.js with a decorator-based approach.
   *
   * The decorators perform the following functions:
   * - @Get(): Registers this method for GET requests only
   * - @HttpCode(HttpStatus.OK): Sets response status to 200 OK
   * - @Header('Content-Type', 'text/plain'): Sets Content-Type header
   *
   * Original helloHandler.js transformation:
   * - Lines 31-32: isGetMethod(req) check → @Get() decorator (implicit)
   * - Lines 39-40: res.statusCode = HTTP_STATUS.OK → @HttpCode decorator
   * - Line 41: res.setHeader('Content-Type', 'text/plain') → @Header decorator
   * - Lines 42-44: res.end(MESSAGES.HELLO_RESPONSE) → return statement
   *
   * Note on 405 handling:
   * NestJS automatically returns 405 Method Not Allowed for HTTP methods
   * that don't have a handler defined. Since only @Get() is decorated,
   * POST, PUT, DELETE, etc. will automatically receive 405 responses.
   * This replaces the handle405(res) function from errorHandler.js.
   *
   * @returns {string} The 'Hello world' message from HelloService
   *
   * @example
   * // Successful GET request
   * curl http://localhost:3000/hello
   * // Response: Hello world
   * // Status: 200 OK
   * // Content-Type: text/plain
   */
  @Get() // Handles GET /hello requests
  @HttpCode(HttpStatus.OK) // Sets HTTP 200 OK status (replaces res.statusCode = 200)
  @Header('Content-Type', 'text/plain') // Sets Content-Type header per API contract
  getHello(): string {
    // Log the incoming request for debugging and monitoring
    // This replaces logger.request() from the original helloHandler.js
    this.logger.log('Handling GET request to /hello endpoint');

    // Delegate to the service layer for business logic
    // This separates HTTP concerns from business logic
    const response = this.helloService.getHello();

    // Log successful response
    this.logger.log('Successfully responding with 200 OK');

    // Return the response - NestJS handles serialization
    // This replaces res.end(MESSAGES.HELLO_RESPONSE) from helloHandler.js
    return response;
  }
}
