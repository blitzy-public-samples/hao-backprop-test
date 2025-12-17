/**
 * @fileoverview Hello Response Data Transfer Object (DTO) for the /hello endpoint
 * @module HelloResponseDto
 * @description
 * This module defines the type-safe Data Transfer Object (DTO) for the /hello endpoint response.
 * In NestJS applications, DTOs are classes that define the shape of data for network transfer,
 * enabling TypeScript compile-time type checking and runtime validation (when combined with
 * class-validator decorators).
 *
 * This DTO transforms the raw string response from the original vanilla Node.js implementation
 * (helloHandler.js) into a structured, type-safe object that can be validated, documented,
 * and consistently used throughout the application.
 *
 * Original Implementation Reference:
 * - Source: src/backend/handlers/helloHandler.js (lines 39-45)
 * - Original response: res.end(MESSAGES.HELLO_RESPONSE) where MESSAGES.HELLO_RESPONSE = 'Hello world'
 * - Source constant: src/backend/utils/constants.js (line 52)
 *
 * @see {@link https://docs.nestjs.com/controllers#request-payloads} NestJS DTO Documentation
 * @author Blitzy Platform
 * @created 2024-12-17
 */

// =============================================================================
// Validation Decorators (Optional - for future validation support)
// =============================================================================
// Note: NestJS DTOs commonly use the class-validator package for runtime validation.
// Decorators like @IsString(), @IsNotEmpty(), @Length() can be added to enforce
// validation rules when processing incoming data or validating outgoing responses.
//
// Example (if class-validator is installed):
// import { IsString, IsNotEmpty } from 'class-validator';
//
// For this simple response DTO, validation decorators are not strictly necessary
// since we're only defining output structure, but the pattern is documented here
// for future extensibility and consistency with NestJS best practices.
// =============================================================================

// =============================================================================
// Constants
// =============================================================================

/**
 * The canonical "Hello world" greeting message returned by the /hello endpoint.
 *
 * This constant centralizes the response message value, ensuring consistency
 * across the DTO factory method and any other usage within the module.
 *
 * @constant {string} HELLO_MESSAGE
 * @description The default greeting message for the /hello endpoint response
 * @see src/backend/utils/constants.js line 52: MESSAGES.HELLO_RESPONSE = 'Hello world'
 *
 * Original source reference:
 * ```javascript
 * // From src/backend/utils/constants.js
 * const MESSAGES = {
 *   HELLO_RESPONSE: 'Hello world',  // <-- This value is replicated here
 *   // ...
 * };
 * ```
 */
const HELLO_MESSAGE: string = 'Hello world';

// =============================================================================
// Data Transfer Object Class
// =============================================================================

/**
 * Data Transfer Object (DTO) representing the response from the GET /hello endpoint.
 *
 * This class encapsulates the structure of the API response, providing:
 * - TypeScript type safety for compile-time checking
 * - A clear contract for the API response shape
 * - Documentation for API consumers and developers
 * - A foundation for adding validation decorators if needed
 *
 * In NestJS, DTOs serve as the contract between the controller layer and
 * external consumers. They define what data is expected in requests and
 * what structure responses will have.
 *
 * @class HelloResponseDto
 * @description Data Transfer Object representing the response from GET /hello endpoint.
 *              Encapsulates the 'Hello world' message in a structured, type-safe format.
 *
 * @property {string} message - The greeting message returned by the endpoint
 *
 * @example
 * // Creating a response DTO manually
 * const response: HelloResponseDto = { message: 'Hello world' };
 *
 * @example
 * // Using the factory method (recommended)
 * const response = HelloResponseDto.create();
 * console.log(response.message); // Output: 'Hello world'
 *
 * @example
 * // Using in a NestJS controller
 * @Get()
 * getHello(): HelloResponseDto {
 *   return HelloResponseDto.create();
 * }
 *
 * @see HelloService - The service that provides the business logic for generating responses
 * @see HelloController - The controller that uses this DTO for response typing
 *
 * @since 1.0.0
 * @export
 */
export class HelloResponseDto {
  // ===========================================================================
  // Class Properties
  // ===========================================================================

  /**
   * The greeting message returned to the client.
   *
   * This property contains the response text that will be sent back to clients
   * when they make a GET request to the /hello endpoint. The default value is
   * 'Hello world', matching the original vanilla Node.js implementation.
   *
   * In the original implementation (helloHandler.js), this was sent directly via:
   * ```javascript
   * res.end(MESSAGES.HELLO_RESPONSE);  // MESSAGES.HELLO_RESPONSE = 'Hello world'
   * ```
   *
   * @type {string}
   * @description The greeting message returned to the client
   * @memberof HelloResponseDto
   *
   * @example 'Hello world'
   *
   * @remarks
   * Future enhancement: Add class-validator decorators for runtime validation:
   * ```typescript
   * @IsString()
   * @IsNotEmpty()
   * message: string;
   * ```
   */
  message: string;

  // ===========================================================================
  // Static Factory Methods
  // ===========================================================================

  /**
   * Factory method to create a new HelloResponseDto instance with the default message.
   *
   * This static factory method provides a convenient way to instantiate the DTO
   * with the canonical 'Hello world' message, ensuring consistency across the
   * application and reducing boilerplate in controllers and services.
   *
   * Using a factory method instead of direct instantiation provides several benefits:
   * 1. Centralized default value management
   * 2. Easier testing and mocking
   * 3. Potential for future parameter injection or customization
   * 4. Cleaner controller/service code
   *
   * @method create
   * @static
   * @description Factory method to create a new HelloResponseDto with the default message
   *
   * @returns {HelloResponseDto} A new instance with the 'Hello world' message
   *
   * @example
   * // Basic usage
   * const dto = HelloResponseDto.create();
   * console.log(dto.message); // 'Hello world'
   *
   * @example
   * // In a NestJS service
   * getHello(): HelloResponseDto {
   *   return HelloResponseDto.create();
   * }
   *
   * @example
   * // In a NestJS controller
   * @Get()
   * getHello(): HelloResponseDto {
   *   return HelloResponseDto.create();
   * }
   *
   * @see HELLO_MESSAGE - The constant used for the default message value
   *
   * @since 1.0.0
   */
  static create(): HelloResponseDto {
    // Create a new DTO instance using object literal syntax
    // This approach is common in NestJS for simple DTOs without complex initialization
    const dto: HelloResponseDto = {
      // Set the message property to the canonical 'Hello world' value
      // This replaces the direct res.end(MESSAGES.HELLO_RESPONSE) from helloHandler.js
      message: HELLO_MESSAGE,
    };

    // Return the fully constructed DTO instance
    return dto;
  }
}

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Type alias for the HelloResponseDto, providing flexibility in type annotations.
 *
 * This type alias extracts only the 'message' property from HelloResponseDto,
 * creating a lightweight type that can be used for:
 * - Function parameter type annotations
 * - Return type declarations
 * - Interface implementations
 * - Type guards and type checking
 *
 * Using a type alias provides several benefits:
 * 1. Decouples consumer code from the concrete class
 * 2. Enables structural typing (duck typing) in TypeScript
 * 3. Allows for more flexible function signatures
 * 4. Facilitates easier testing with mock objects
 *
 * @typedef {Pick<HelloResponseDto, 'message'>} HelloResponse
 * @description Type alias representing the shape of a hello endpoint response
 *
 * @property {string} message - The greeting message
 *
 * @example
 * // Using the type alias for function parameters
 * function processResponse(response: HelloResponse): void {
 *   console.log(response.message);
 * }
 *
 * @example
 * // Using the type alias for variable declarations
 * const myResponse: HelloResponse = { message: 'Hello world' };
 *
 * @example
 * // Using with the DTO class
 * const dto: HelloResponse = HelloResponseDto.create();
 *
 * @see HelloResponseDto - The class this type is derived from
 *
 * @since 1.0.0
 * @export
 */
export type HelloResponse = Pick<HelloResponseDto, 'message'>;

// =============================================================================
// Module Documentation
// =============================================================================
/**
 * @module Summary
 *
 * This module provides the following exports:
 *
 * 1. **HelloResponseDto** (class)
 *    - The main DTO class for /hello endpoint responses
 *    - Properties: message (string)
 *    - Methods: create() - static factory method
 *
 * 2. **HelloResponse** (type)
 *    - Type alias for structural typing flexibility
 *    - Equivalent to { message: string }
 *
 * Usage in the NestJS application:
 *
 * ```typescript
 * // In HelloController
 * import { HelloResponseDto, HelloResponse } from './dto/hello-response.dto';
 *
 * @Controller('hello')
 * export class HelloController {
 *   @Get()
 *   getHello(): HelloResponse {
 *     return HelloResponseDto.create();
 *   }
 * }
 * ```
 *
 * This DTO enables:
 * - Type-safe request/response handling throughout the hello feature module
 * - Consistent API response structure
 * - Foundation for adding validation decorators (class-validator)
 * - Clear documentation for API consumers
 * - Separation of concerns between data structure and business logic
 */
