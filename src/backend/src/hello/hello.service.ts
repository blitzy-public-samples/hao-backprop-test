/**
 * @fileoverview Hello endpoint business logic service
 *
 * This module provides the business logic layer for the /hello endpoint,
 * extracting core functionality from the original vanilla Node.js
 * handlers/helloHandler.js into a dedicated NestJS injectable service.
 *
 * @module HelloService
 *
 * @description
 * The HelloService implements the business logic for the Hello World API,
 * specifically the generation and return of the "Hello world" greeting
 * message. By extracting this logic into a service layer, we achieve:
 *
 * - Separation of concerns (HTTP handling vs business logic)
 * - Easy unit testing of business logic in isolation
 * - Reusability of the service across multiple controllers if needed
 * - Compliance with NestJS dependency injection patterns
 *
 * This service transforms the inline response logic from the original
 * helloHandler.js handleHelloRequest() function into a proper service
 * method that can be injected and tested independently.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/providers NestJS Providers}
 * @see {@link https://docs.nestjs.com/fundamentals/custom-providers NestJS Custom Providers}
 *
 * @example
 * // Inject HelloService into a controller
 * @Controller('hello')
 * export class HelloController {
 *   constructor(private readonly helloService: HelloService) {}
 *
 *   @Get()
 *   getHello(): string {
 *     return this.helloService.getHello();
 *   }
 * }
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, local modules
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// Core decorators for dependency injection
import {
  Injectable, // Decorator marking the class for dependency injection
  Logger, // NestJS built-in logger for consistent application logging
} from '@nestjs/common';

// -----------------------------------------------------------------------------
// Local Module Imports
// -----------------------------------------------------------------------------
// Application constants for consistent messaging
import { MESSAGES } from '../common/constants';

/* ============================================================================
 * HELLO SERVICE CLASS
 * ============================================================================
 * Injectable service providing business logic for the /hello endpoint
 * ============================================================================ */

/**
 * Service class providing business logic for the Hello World endpoint
 *
 * @class HelloService
 *
 * @description
 * This service encapsulates the business logic for the /hello endpoint,
 * implementing the NestJS provider pattern for dependency injection.
 * It replaces the inline response generation from the original vanilla
 * Node.js helloHandler.js with a proper service layer.
 *
 * The service is decorated with @Injectable() which registers it in the
 * NestJS dependency injection container, allowing it to be automatically
 * injected into controllers and other services that declare it as a
 * dependency in their constructor.
 *
 * Key responsibilities:
 * - Generate the "Hello world" greeting message
 * - Provide a clean interface for business logic
 * - Enable easy testing through dependency injection
 *
 * @injectable Registered in HelloModule's providers array
 *
 * @example
 * // Usage in controller with constructor injection
 * @Controller('hello')
 * export class HelloController {
 *   constructor(private readonly helloService: HelloService) {}
 *
 *   @Get()
 *   getHello(): string {
 *     return this.helloService.getHello();
 *   }
 * }
 *
 * @example
 * // Direct instantiation for testing
 * const service = new HelloService();
 * const message = service.getHello(); // Returns 'Hello world'
 */
@Injectable() // Marks this class as injectable by NestJS DI container
export class HelloService {
  /* --------------------------------------------------------------------------
   * CLASS PROPERTIES
   * --------------------------------------------------------------------------
   * Logger instance for service-level logging
   * -------------------------------------------------------------------------- */

  /**
   * Private logger instance for this service
   *
   * @private
   * @readonly
   *
   * @description
   * Uses NestJS's built-in Logger class for consistent logging across
   * the application. The logger is initialized with the service's class
   * name to make log entries easily identifiable in application logs.
   *
   * This replaces the custom logger.js module from the original
   * implementation with NestJS's integrated logging infrastructure.
   */
  private readonly logger = new Logger(HelloService.name);

  /* --------------------------------------------------------------------------
   * PUBLIC METHODS
   * --------------------------------------------------------------------------
   * Business logic methods for the Hello endpoint
   * -------------------------------------------------------------------------- */

  /**
   * Returns the Hello World greeting message
   *
   * @method getHello
   *
   * @description
   * This method returns the canonical "Hello world" greeting message
   * that is the primary response of the /hello endpoint. It extracts
   * the core response generation logic from the original helloHandler.js
   * handleHelloRequest() function (specifically lines 39-45 where
   * res.end(MESSAGES.HELLO_RESPONSE) was called).
   *
   * The method uses the centralized MESSAGES constant to ensure
   * consistency with the rest of the application and enable easy
   * modification of the message if needed.
   *
   * @returns {string} The 'Hello world' message constant
   *
   * @example
   * const helloService = new HelloService();
   * const message = helloService.getHello();
   * console.log(message); // Output: 'Hello world'
   *
   * @example
   * // In a controller context
   * @Get()
   * getHello(): string {
   *   return this.helloService.getHello(); // Returns 'Hello world'
   * }
   */
  getHello(): string {
    // Log the operation for debugging and monitoring
    // This replaces logger.debug() calls from the original implementation
    this.logger.log('Generating Hello world response');

    // Return the canonical Hello world message
    // This replaces res.end(MESSAGES.HELLO_RESPONSE) from helloHandler.js
    // The controller is now responsible for HTTP response formatting
    return MESSAGES.HELLO_RESPONSE;
  }
}
