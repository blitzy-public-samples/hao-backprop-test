/**
 * @fileoverview Application-wide constants for the NestJS Hello World application
 *
 * This module provides centralized, immutable constant values used throughout
 * the application, ensuring consistency and type safety across all components.
 *
 * @module common/constants
 *
 * @description
 * Defines typed constant objects for:
 * - HTTP status codes (200, 404, 405, 500)
 * - API route paths (/hello, /health)
 * - Server configuration (port settings)
 * - Response message strings
 * - HTTP header names and values
 * - HTTP method names
 *
 * All constants use TypeScript's `as const` assertion for maximum type safety
 * and immutability. Type aliases are exported for each constant object to
 * enable type-safe usage throughout the application.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/fundamentals/custom-providers NestJS Custom Providers}
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/narrowing.html#const-assertions TypeScript Const Assertions}
 *
 * @example
 * // Import specific constants
 * import { HTTP_STATUS, MESSAGES, ROUTES } from './common/constants';
 *
 * // Use in a controller
 * if (response.statusCode === HTTP_STATUS.OK) {
 *   return MESSAGES.HELLO_RESPONSE;
 * }
 *
 * @example
 * // Import types for type annotations
 * import { HttpStatusType, MessagesType } from './common/constants';
 *
 * function getStatusMessage(status: HttpStatusType[keyof HttpStatusType]): string {
 *   // Type-safe status code handling
 * }
 */

/* ============================================================================
 * HTTP STATUS CODES
 * ============================================================================
 * Standard HTTP status codes used by the application for response handling.
 * These codes follow RFC 7231 specifications for HTTP/1.1 semantics.
 * ============================================================================ */

/**
 * HTTP status code constants for standardized response handling
 *
 * @constant
 * @description
 * Provides numeric HTTP status codes as defined by RFC 7231.
 * Used throughout the application for consistent status code usage.
 *
 * These status codes are utilized by:
 * - Controllers for setting response status
 * - Exception filters for error responses
 * - E2E tests for response validation
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status HTTP Status Codes - MDN}
 *
 * @example
 * // Setting response status in a controller
 * @Get()
 * @HttpCode(HTTP_STATUS.OK)
 * getHello(): string {
 *   return 'Hello world';
 * }
 *
 * @example
 * // Using in exception filter
 * response.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not Found' });
 */
export const HTTP_STATUS = {
  /**
   * HTTP 200 OK
   * Indicates that the request has succeeded.
   * Used for successful GET /hello responses.
   */
  OK: 200,

  /**
   * HTTP 404 Not Found
   * Indicates that the server cannot find the requested resource.
   * Used when a client requests an unknown route.
   */
  NOT_FOUND: 404,

  /**
   * HTTP 405 Method Not Allowed
   * Indicates that the request method is not supported for the target resource.
   * Used when a client sends a non-GET request to the /hello endpoint.
   * The response includes an 'Allow' header specifying permitted methods.
   */
  METHOD_NOT_ALLOWED: 405,

  /**
   * HTTP 500 Internal Server Error
   * Indicates that the server encountered an unexpected condition.
   * Used for unhandled exceptions and unexpected server errors.
   */
  INTERNAL_SERVER_ERROR: 500,
} as const;

/* ============================================================================
 * ROUTE PATH CONSTANTS
 * ============================================================================
 * API endpoint paths used for routing within the NestJS application.
 * These paths are registered with controllers via decorators.
 * ============================================================================ */

/**
 * API route path constants for endpoint registration
 *
 * @constant
 * @description
 * Defines the URL paths for all API endpoints in the application.
 * Used by controllers for route registration and by tests for endpoint validation.
 *
 * Benefits of centralizing route paths:
 * - Single source of truth for all endpoints
 * - Easy refactoring when paths need to change
 * - Consistent usage across controllers and tests
 *
 * @example
 * // Using in a controller decorator
 * @Controller(ROUTES.HELLO)
 * export class HelloController { }
 *
 * @example
 * // Using in e2e tests
 * const response = await request(app.getHttpServer())
 *   .get(ROUTES.HELLO)
 *   .expect(HTTP_STATUS.OK);
 */
export const ROUTES = {
  /**
   * Hello endpoint route path
   * Primary endpoint that returns the "Hello world" greeting.
   * Accepts only GET requests, returns 405 for other methods.
   */
  HELLO: '/hello',

  /**
   * Health check endpoint route path
   * Used for service health monitoring and container health checks.
   * Typically returns a simple OK status for load balancers and orchestrators.
   */
  HEALTH: '/health',
} as const;

/* ============================================================================
 * SERVER CONFIGURATION CONSTANTS
 * ============================================================================
 * Configuration values for server setup and environment variable handling.
 * These constants define defaults and environment variable names.
 * ============================================================================ */

/**
 * Server configuration constants for application setup
 *
 * @constant
 * @description
 * Provides configuration values for server initialization including
 * default values and environment variable names for configuration overrides.
 *
 * Configuration priority:
 * 1. Environment variable (highest priority)
 * 2. Default value (fallback)
 *
 * @example
 * // Reading port configuration with fallback
 * const port = process.env[CONFIG.ENV_VAR_PORT] || CONFIG.DEFAULT_PORT;
 *
 * @example
 * // Using with NestJS ConfigService
 * const port = configService.get<number>('port', CONFIG.DEFAULT_PORT);
 */
export const CONFIG = {
  /**
   * Default server port when not specified in environment
   * The application listens on this port if PORT environment variable is not set.
   * Standard port for development environments.
   */
  DEFAULT_PORT: 3000,

  /**
   * Environment variable name for port configuration
   * Allows runtime configuration of the server port via environment.
   * Example: PORT=8080 npm start
   */
  ENV_VAR_PORT: 'PORT',
} as const;

/* ============================================================================
 * MESSAGE STRING CONSTANTS
 * ============================================================================
 * Response messages and logging strings used throughout the application.
 * Centralizing messages enables consistent messaging and easy localization.
 * ============================================================================ */

/**
 * Message string constants for responses and logging
 *
 * @constant
 * @description
 * Provides standardized text messages used for HTTP responses and server logging.
 * Centralizing messages ensures consistency and simplifies potential localization.
 *
 * Message categories:
 * - Success responses (HELLO_RESPONSE)
 * - Error responses (NOT_FOUND, METHOD_NOT_ALLOWED, SERVER_ERROR)
 * - Server lifecycle logging (SERVER_STARTED)
 *
 * @example
 * // Returning success message from service
 * getHello(): string {
 *   return MESSAGES.HELLO_RESPONSE;
 * }
 *
 * @example
 * // Using in exception filter
 * throw new NotFoundException(MESSAGES.NOT_FOUND);
 *
 * @example
 * // Server startup logging with printf-style formatting
 * logger.log(MESSAGES.SERVER_STARTED.replace('%d', String(port)));
 */
export const MESSAGES = {
  /**
   * Response text for the hello endpoint
   * The primary message returned by the GET /hello endpoint.
   * This exact string must be returned to maintain API contract.
   */
  HELLO_RESPONSE: 'Hello world',

  /**
   * Message for 404 Not Found responses
   * Returned when a client requests a route that does not exist.
   * Used by exception filters for consistent error messaging.
   */
  NOT_FOUND: 'Not Found',

  /**
   * Message for 405 Method Not Allowed responses
   * Returned when a client uses an unsupported HTTP method on an endpoint.
   * For example, POST requests to /hello receive this message.
   */
  METHOD_NOT_ALLOWED: 'Method Not Allowed',

  /**
   * Message for 500 Internal Server Error responses
   * Returned when an unhandled exception occurs on the server.
   * Used by the all-exceptions filter for unexpected errors.
   */
  SERVER_ERROR: 'Internal Server Error',

  /**
   * Server startup message template (printf-style format)
   * Logged when the server successfully starts and begins listening.
   * The %d placeholder should be replaced with the actual port number.
   *
   * @example
   * // Usage with string replacement
   * const message = MESSAGES.SERVER_STARTED.replace('%d', '3000');
   * // Result: "Server started on port 3000"
   */
  SERVER_STARTED: 'Server started on port %d',
} as const;

/* ============================================================================
 * HTTP HEADER CONSTANTS
 * ============================================================================
 * HTTP header names and values used for response configuration.
 * Centralizing headers prevents typos and ensures consistency.
 * ============================================================================ */

/**
 * HTTP header constants for response configuration
 *
 * @constant
 * @description
 * Provides standardized HTTP header names and values for response configuration.
 * Using constants prevents typos and ensures consistent header usage.
 *
 * Headers used by this application:
 * - Content-Type: Specifies the media type of the response body
 * - Allow: Lists permitted HTTP methods (used with 405 responses)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers HTTP Headers - MDN}
 *
 * @example
 * // Setting Content-Type header
 * response.setHeader(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT);
 *
 * @example
 * // Setting Allow header for Method Not Allowed responses
 * response.setHeader(HEADERS.ALLOW, HTTP_METHODS.GET);
 */
export const HEADERS = {
  /**
   * Content-Type header name
   * Standard HTTP header indicating the media type of the response body.
   */
  CONTENT_TYPE: 'Content-Type',

  /**
   * Content-Type value for plain text responses
   * Used for simple text responses like "Hello world".
   * Indicates the response body contains unformatted text.
   */
  CONTENT_TYPE_TEXT: 'text/plain',

  /**
   * Allow header name
   * Standard HTTP header indicating allowed methods for a resource.
   * Required in 405 Method Not Allowed responses per RFC 7231.
   */
  ALLOW: 'Allow',
} as const;

/* ============================================================================
 * HTTP METHOD CONSTANTS
 * ============================================================================
 * HTTP method names used for request validation and routing.
 * ============================================================================ */

/**
 * HTTP method constants for request handling
 *
 * @constant
 * @description
 * Provides standardized HTTP method names for request validation.
 * Used to verify request methods and set Allow headers.
 *
 * Currently, the application only supports the GET method for the /hello endpoint.
 * Additional methods can be added here as the API expands.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods HTTP Methods - MDN}
 *
 * @example
 * // Validating request method
 * if (request.method !== HTTP_METHODS.GET) {
 *   throw new MethodNotAllowedException();
 * }
 *
 * @example
 * // Setting Allow header value
 * response.setHeader(HEADERS.ALLOW, HTTP_METHODS.GET);
 */
export const HTTP_METHODS = {
  /**
   * HTTP GET method
   * Requests a representation of the specified resource.
   * The only method allowed for the /hello endpoint.
   */
  GET: 'GET',
} as const;

/* ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 * Type aliases for each constant object enabling type-safe usage.
 * These types can be used for parameter typing and return type annotations.
 * ============================================================================ */

/**
 * Type representing the HTTP_STATUS constant object
 *
 * @typedef {typeof HTTP_STATUS} HttpStatusType
 * @description
 * Provides type-safe access to HTTP status code constants.
 * Useful for typing parameters that accept any status code from the object.
 *
 * @example
 * // Typing a function parameter
 * function handleStatus(status: HttpStatusType[keyof HttpStatusType]): void {
 *   // status is narrowed to 200 | 404 | 405 | 500
 * }
 */
export type HttpStatusType = typeof HTTP_STATUS;

/**
 * Type representing the ROUTES constant object
 *
 * @typedef {typeof ROUTES} RoutesType
 * @description
 * Provides type-safe access to route path constants.
 * Useful for typing route path parameters in utility functions.
 *
 * @example
 * // Typing a route path parameter
 * function buildUrl(route: RoutesType[keyof RoutesType]): string {
 *   return `http://localhost:3000${route}`;
 * }
 */
export type RoutesType = typeof ROUTES;

/**
 * Type representing the CONFIG constant object
 *
 * @typedef {typeof CONFIG} ConfigType
 * @description
 * Provides type-safe access to configuration constants.
 * Useful for typing configuration-related parameters.
 *
 * @example
 * // Accessing config type properties
 * const port: ConfigType['DEFAULT_PORT'] = 3000;
 */
export type ConfigType = typeof CONFIG;

/**
 * Type representing the MESSAGES constant object
 *
 * @typedef {typeof MESSAGES} MessagesType
 * @description
 * Provides type-safe access to message string constants.
 * Useful for typing message parameters in response handlers.
 *
 * @example
 * // Typing a message parameter
 * function sendResponse(message: MessagesType[keyof MessagesType]): void {
 *   response.send(message);
 * }
 */
export type MessagesType = typeof MESSAGES;

/**
 * Type representing the HEADERS constant object
 *
 * @typedef {typeof HEADERS} HeadersType
 * @description
 * Provides type-safe access to HTTP header constants.
 * Useful for typing header-related parameters.
 *
 * @example
 * // Typing a header name parameter
 * function setHeader(name: HeadersType[keyof HeadersType], value: string): void {
 *   response.setHeader(name, value);
 * }
 */
export type HeadersType = typeof HEADERS;

/**
 * Type representing the HTTP_METHODS constant object
 *
 * @typedef {typeof HTTP_METHODS} HttpMethodsType
 * @description
 * Provides type-safe access to HTTP method constants.
 * Useful for typing method validation parameters.
 *
 * @example
 * // Typing a method parameter
 * function isAllowedMethod(method: string): method is HttpMethodsType[keyof HttpMethodsType] {
 *   return method === HTTP_METHODS.GET;
 * }
 */
export type HttpMethodsType = typeof HTTP_METHODS;
