/**
 * @fileoverview Unit tests for HttpExceptionFilter exception filter
 *
 * This test suite validates the NestJS HttpExceptionFilter implementation,
 * ensuring proper handling of HTTP exceptions including 404 Not Found and
 * 405 Method Not Allowed responses. The tests verify that exception handling
 * maintains backward compatibility with the original Node.js error handler.
 *
 * @module HttpExceptionFilterSpec
 *
 * @description
 * Tests HTTP exception handling including:
 * - 404 Not Found responses with correct headers and body
 * - 405 Method Not Allowed responses with required Allow header
 * - Content-Type header set to text/plain for all error responses
 * - Proper logging of exception details
 * - Handling of other HTTP exceptions
 *
 * The test suite transforms the original src/backend/__tests__/errorHandler.test.js
 * to NestJS-compatible exception filter testing patterns using ArgumentsHost
 * mocks and Jest matchers.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link HttpExceptionFilter} The filter class under test
 * @see {@link https://docs.nestjs.com/exception-filters NestJS Exception Filters}
 * @see {@link https://jestjs.io/docs/mock-functions Jest Mock Functions}
 *
 * @example
 * // Running these tests
 * npm test -- --testPathPattern=http-exception.filter.spec
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Import statements are organized into logical groups:
 * 1. NestJS testing utilities - For creating test modules and mocks
 * 2. NestJS common - HTTP exceptions and ArgumentsHost interface
 * 3. Filter under test - The HttpExceptionFilter class to validate
 * 4. Constants - For verifying correct message and header values
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Testing Imports
// -----------------------------------------------------------------------------
// Test utility for creating isolated testing modules with proper DI container.
// createTestingModule() bootstraps the filter in isolation for unit testing.
// -----------------------------------------------------------------------------
import { Test, TestingModule } from '@nestjs/testing';

// -----------------------------------------------------------------------------
// NestJS Common Imports
// -----------------------------------------------------------------------------
// Core NestJS types and utilities for exception handling:
// - HttpException: Base class for HTTP exceptions that the filter catches
// - HttpStatus: Enum of HTTP status codes for creating test exceptions
// - ArgumentsHost: Interface for the execution context passed to catch()
// - Logger: NestJS logging service that we mock for verification
// -----------------------------------------------------------------------------
import { HttpException, HttpStatus, ArgumentsHost, Logger } from '@nestjs/common';

// -----------------------------------------------------------------------------
// Filter Under Test Import
// -----------------------------------------------------------------------------
// The HttpExceptionFilter class that we are testing. This filter implements
// the ExceptionFilter interface and catches HttpException instances,
// formatting them into consistent text/plain error responses.
// -----------------------------------------------------------------------------
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter';

// -----------------------------------------------------------------------------
// Constants Imports
// -----------------------------------------------------------------------------
// Application constants for verifying correct header names and values.
// These constants ensure the filter sets proper Content-Type and Allow headers.
// - HEADERS: Contains CONTENT_TYPE, CONTENT_TYPE_TEXT, and ALLOW constants
// - MESSAGES: Contains NOT_FOUND and METHOD_NOT_ALLOWED message strings
// - HTTP_METHODS: Contains GET method constant for Allow header value
// -----------------------------------------------------------------------------
import { HEADERS, MESSAGES, HTTP_METHODS } from '../../../../src/common/constants';

/* ============================================================================
 * MOCK FACTORY FUNCTIONS
 * ============================================================================
 * Helper functions to create mock objects for testing the exception filter.
 * These mocks simulate Express Request/Response objects and the NestJS
 * ArgumentsHost context that the filter receives during exception handling.
 * ============================================================================ */

/**
 * Creates a mock Express Response object for testing
 *
 * @description
 * Creates a mock response object that simulates Express Response behavior.
 * All methods are Jest mock functions that return 'this' for chaining,
 * mimicking the Express Response fluent API pattern.
 *
 * The mock tracks method calls and arguments for assertion in tests:
 * - status(): Verifies the correct HTTP status code is set
 * - set(): Verifies correct headers are applied (Content-Type, Allow)
 * - send(): Verifies the correct response body is sent
 *
 * @returns {object} Mock response object with chainable mock methods
 *
 * @example
 * // Creating and using the mock response
 * const mockResponse = createMockResponse();
 * filter.catch(exception, mockHost);
 * expect(mockResponse.status).toHaveBeenCalledWith(404);
 */
function createMockResponse() {
  // Create mock functions that return 'this' for method chaining
  // This matches Express Response's fluent API design pattern
  const mockResponse = {
    // status() sets the HTTP response status code
    // Returns this for chaining: res.status(404).set('header').send('body')
    status: jest.fn().mockReturnThis(),

    // set() sets HTTP response headers
    // Used for Content-Type and Allow headers
    set: jest.fn().mockReturnThis(),

    // send() sends the response body and completes the response
    // This is the final method in the chain
    send: jest.fn().mockReturnThis(),
  };

  return mockResponse;
}

/**
 * Creates a mock Express Request object for testing
 *
 * @description
 * Creates a mock request object that simulates Express Request with
 * the properties needed for logging and debugging in the exception filter.
 *
 * @param {string} method - HTTP method (GET, POST, etc.) for the mock request
 * @param {string} url - Request URL path for the mock request
 * @returns {object} Mock request object with method and url properties
 *
 * @example
 * // Creating a mock GET request to /hello
 * const mockRequest = createMockRequest('GET', '/hello');
 */
function createMockRequest(method: string = 'GET', url: string = '/test') {
  // Return an object matching the Express Request properties used by the filter
  // The filter only accesses method and url for logging purposes
  return {
    // HTTP method used in the request (GET, POST, PUT, DELETE, etc.)
    method,

    // URL path that was requested
    url,
  };
}

/**
 * Creates a mock ArgumentsHost object for testing NestJS exception filters
 *
 * @description
 * Creates a mock of NestJS's ArgumentsHost interface, which is passed to
 * exception filters' catch() method. The mock implements the switchToHttp()
 * pattern that the HttpExceptionFilter uses to access Express objects.
 *
 * ArgumentsHost provides execution context abstraction in NestJS, supporting
 * HTTP, WebSocket, and RPC contexts. For HTTP requests, we use switchToHttp()
 * to access the underlying Express Request and Response objects.
 *
 * @param {object} mockResponse - Mock response object from createMockResponse()
 * @param {object} mockRequest - Mock request object from createMockRequest()
 * @returns {object} Mock ArgumentsHost with switchToHttp() implementation
 *
 * @example
 * // Creating ArgumentsHost mock with request and response
 * const mockResponse = createMockResponse();
 * const mockRequest = createMockRequest('POST', '/hello');
 * const mockHost = createMockArgumentsHost(mockResponse, mockRequest);
 */
function createMockArgumentsHost(
  mockResponse: ReturnType<typeof createMockResponse>,
  mockRequest: ReturnType<typeof createMockRequest>,
) {
  // Create a mock that matches the ArgumentsHost interface structure
  // The filter calls host.switchToHttp() to get HTTP-specific context
  const mockHost: ArgumentsHost = {
    // switchToHttp() returns an HttpArgumentsHost with getRequest/getResponse
    // This is the primary method used by HTTP exception filters
    switchToHttp: () => ({
      // getRequest() returns the Express Request object
      // Used by filter for logging request details (method, url)
      getRequest: () => mockRequest,

      // getResponse() returns the Express Response object
      // Used by filter to send the formatted error response
      getResponse: () => mockResponse,

      // getNext() returns the next function (used in Express middleware)
      // Not used by exception filters but required by HttpArgumentsHost interface
      getNext: () => jest.fn(),
    }),

    // These methods are part of ArgumentsHost interface but not used by our filter
    // We implement them as no-ops to satisfy the interface type requirements
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({
      getContext: () => undefined,
      getData: () => undefined,
    }),
    switchToWs: () => ({
      getClient: () => undefined,
      getData: () => undefined,
      getPattern: () => '' as string,
    }),
    getType: () => 'http',
  } as ArgumentsHost;

  return mockHost;
}

/* ============================================================================
 * TEST SUITE
 * ============================================================================
 * Main test suite for HttpExceptionFilter validation.
 * Tests cover 404, 405, and generic HTTP exception handling.
 * ============================================================================ */

/**
 * @description
 * Test suite for the HttpExceptionFilter class that validates HTTP exception
 * handling behavior. This suite tests the transformation from the original
 * Node.js errorHandler to NestJS exception filter patterns.
 *
 * Test Coverage:
 * - 404 Not Found exception handling with correct headers and body
 * - 405 Method Not Allowed exception handling with Allow header
 * - Content-Type: text/plain header for all error responses
 * - Logger invocation for exception tracking
 * - Generic HTTP exception handling for other status codes
 *
 * Each test creates fresh mocks to ensure test isolation and prevent
 * state leakage between tests.
 */
describe('HttpExceptionFilter', () => {
  // -------------------------------------------------------------------------
  // Test Suite Variables
  // -------------------------------------------------------------------------
  // Variables declared at suite level for use across all tests.
  // These are reset in beforeEach to ensure test isolation.
  // -------------------------------------------------------------------------

  /**
   * Instance of the HttpExceptionFilter being tested
   * Recreated before each test for isolation
   */
  let filter: HttpExceptionFilter;

  /**
   * Mock Express Response object for verifying response methods
   * Tracks calls to status(), set(), and send()
   */
  let mockResponse: ReturnType<typeof createMockResponse>;

  /**
   * Mock Express Request object for providing request context
   * Contains method and url properties for logging
   */
  let mockRequest: ReturnType<typeof createMockRequest>;

  /**
   * Mock NestJS ArgumentsHost for passing to catch() method
   * Provides access to mockRequest and mockResponse through switchToHttp()
   */
  let mockHost: ArgumentsHost;

  /**
   * Spy on Logger.prototype.log for verifying log calls
   * Used to verify the filter logs exception details
   */
  let loggerLogSpy: jest.SpyInstance;

  /**
   * Spy on Logger.prototype.warn for verifying warning logs
   * Used to verify the filter warns about unexpected HTTP exceptions
   */
  let loggerWarnSpy: jest.SpyInstance;

  // -------------------------------------------------------------------------
  // Test Setup
  // -------------------------------------------------------------------------
  // beforeEach runs before each test to set up fresh instances of all
  // dependencies. This ensures tests are isolated and don't affect each other.
  // -------------------------------------------------------------------------

  /**
   * @description
   * Sets up the test environment before each test case.
   *
   * Creates fresh instances of:
   * - HttpExceptionFilter for testing
   * - Mock response, request, and ArgumentsHost objects
   * - Logger spies for verifying log output
   *
   * This setup mirrors the original errorHandler.test.js beforeEach block
   * but adapts it for NestJS testing patterns with ArgumentsHost mocking.
   */
  beforeEach(async () => {
    // Clear all Jest mocks to prevent state leakage between tests
    // This ensures each test starts with clean mock state
    jest.clearAllMocks();

    // Create a NestJS testing module to bootstrap the filter
    // This follows NestJS testing best practices for unit tests
    const module: TestingModule = await Test.createTestingModule({
      // Provide the HttpExceptionFilter as a provider for DI
      providers: [HttpExceptionFilter],
    }).compile();

    // Get the filter instance from the testing module
    // This ensures the filter is properly instantiated with DI
    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Create fresh mock objects for this test
    // Each test gets its own mocks to ensure isolation
    mockResponse = createMockResponse();
    mockRequest = createMockRequest();
    mockHost = createMockArgumentsHost(mockResponse, mockRequest);

    // Set up Logger spies to verify logging behavior
    // We spy on the prototype to catch all Logger instances
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  // -------------------------------------------------------------------------
  // Test Cleanup
  // -------------------------------------------------------------------------
  // afterEach runs after each test to clean up resources and restore mocks
  // -------------------------------------------------------------------------

  /**
   * @description
   * Cleans up after each test by restoring all mocked functions.
   * This ensures Logger spies don't affect other test files.
   */
  afterEach(() => {
    // Restore all mocked functions to their original implementations
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Filter Instantiation Tests
  // -------------------------------------------------------------------------

  /**
   * @description
   * Verifies that the HttpExceptionFilter can be properly instantiated.
   * This basic test ensures the filter is correctly set up in the DI container.
   */
  it('should be defined', () => {
    // Verify the filter instance exists and is properly created
    expect(filter).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 404 Not Found Tests
  // -------------------------------------------------------------------------
  // Tests for handling 404 Not Found exceptions
  // Transforms: describe('handle404') from errorHandler.test.js lines 125-141
  // -------------------------------------------------------------------------

  /**
   * @description
   * Test suite for 404 Not Found exception handling.
   *
   * Validates that when a NotFoundException (or HttpException with 404 status)
   * is thrown, the filter correctly:
   * - Sets status code to 404
   * - Sets Content-Type header to text/plain
   * - Sends the "Not Found" message body
   *
   * This mirrors the original handle404 tests from errorHandler.test.js
   * but uses NestJS exception filter patterns with ArgumentsHost mocks.
   */
  describe('404 Not Found handling', () => {
    /**
     * @description
     * Verifies that 404 exceptions result in correct status code.
     * Transforms: expect(res.statusCode).toBe(HTTP_STATUS.NOT_FOUND) line 134
     */
    it('should handle 404 Not Found exception with correct status code', () => {
      // Arrange: Create a 404 Not Found exception
      // HttpException with status 404 is equivalent to NotFoundException
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act: Call the filter's catch method with the exception
      filter.catch(exception, mockHost);

      // Assert: Verify the response status was set to 404
      // This matches the original test assertion for res.statusCode
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    /**
     * @description
     * Verifies that 404 responses include Content-Type: text/plain header.
     * Per Section 0.6.4, all error responses must have Content-Type: text/plain.
     * Transforms: expect(res.setHeader).toHaveBeenCalledWith(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT) line 135
     */
    it('should set Content-Type header to text/plain for 404 responses', () => {
      // Arrange: Create a 404 Not Found exception
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify Content-Type header was set correctly
      // CRITICAL: Per Section 0.6.4 API contract requirements,
      // all error responses must have Content-Type: text/plain
      expect(mockResponse.set).toHaveBeenCalledWith(
        HEADERS.CONTENT_TYPE,
        HEADERS.CONTENT_TYPE_TEXT,
      );
    });

    /**
     * @description
     * Verifies that 404 responses include the exact "Not Found" message body.
     * Per Section 0.6.4, the exact error message must match the API contract.
     * Transforms: expect(res.end).toHaveBeenCalledWith(MESSAGES.NOT_FOUND) line 136
     */
    it('should send "Not Found" message body for 404 responses', () => {
      // Arrange: Create a 404 Not Found exception
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify the exact error message was sent
      // CRITICAL: Per Section 0.6.4, the exact message body must be "Not Found"
      // to maintain backward compatibility with the original API contract
      expect(mockResponse.send).toHaveBeenCalledWith(MESSAGES.NOT_FOUND);
    });

    /**
     * @description
     * Verifies that 404 exceptions are logged for debugging.
     * Transforms: expect(logger.info).toHaveBeenCalledWith('Responding with 404 Not Found') line 139
     */
    it('should log 404 Not Found exception details', () => {
      // Arrange: Create a 404 exception and set up request context
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify logger was called with appropriate message
      // The log should indicate a 404 response is being sent
      expect(loggerLogSpy).toHaveBeenCalled();
      // Verify the log message contains the expected text
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('404 Not Found'));
    });
  });

  // -------------------------------------------------------------------------
  // 405 Method Not Allowed Tests
  // -------------------------------------------------------------------------
  // Tests for handling 405 Method Not Allowed exceptions
  // Transforms: describe('handle405') from errorHandler.test.js lines 143-159
  // -------------------------------------------------------------------------

  /**
   * @description
   * Test suite for 405 Method Not Allowed exception handling.
   *
   * Validates that when a MethodNotAllowedException (or HttpException with 405)
   * is thrown, the filter correctly:
   * - Sets status code to 405
   * - Sets Content-Type header to text/plain
   * - Sets Allow header to "GET" (CRITICAL API contract requirement)
   * - Sends the "Method Not Allowed" message body
   *
   * The Allow header is REQUIRED per RFC 7231 Section 6.5.5 and
   * Section 0.6.4 of the specification.
   */
  describe('405 Method Not Allowed handling', () => {
    /**
     * @description
     * Verifies that 405 exceptions result in correct status code.
     * Transforms: expect(res.statusCode).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED) line 152
     */
    it('should handle 405 Method Not Allowed exception with correct status code', () => {
      // Arrange: Create a 405 Method Not Allowed exception
      // Set up mock request with POST method to simulate invalid method
      mockRequest = createMockRequest('POST', '/hello');
      mockHost = createMockArgumentsHost(mockResponse, mockRequest);
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify the response status was set to 405
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.METHOD_NOT_ALLOWED);
    });

    /**
     * @description
     * Verifies that 405 responses include Content-Type: text/plain header.
     * Per Section 0.6.4, all error responses must have Content-Type: text/plain.
     * Transforms: expect(res.setHeader).toHaveBeenCalledWith(HEADERS.CONTENT_TYPE, HEADERS.CONTENT_TYPE_TEXT) line 153
     */
    it('should set Content-Type header to text/plain for 405 responses', () => {
      // Arrange: Create a 405 exception
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify Content-Type header was set
      expect(mockResponse.set).toHaveBeenCalledWith(
        HEADERS.CONTENT_TYPE,
        HEADERS.CONTENT_TYPE_TEXT,
      );
    });

    /**
     * @description
     * CRITICAL TEST: Verifies that 405 responses include the Allow header.
     *
     * Per RFC 7231 Section 6.5.5, 405 Method Not Allowed responses MUST
     * include an Allow header field containing a list of valid methods.
     *
     * This is a CRITICAL API contract requirement from Section 0.6.4:
     * "Tests must verify 405 responses include Allow: GET header"
     *
     * Transforms: expect(res.setHeader).toHaveBeenCalledWith(HEADERS.ALLOW, HTTP_METHODS.GET) line 154
     */
    it('should set Allow header to "GET" for 405 responses', () => {
      // Arrange: Create a 405 exception
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: CRITICAL - Verify Allow header is set to "GET"
      // Per Section 0.6.4: Tests MUST verify 405 responses include Allow: GET header
      // Per RFC 7231 Section 6.5.5: 405 responses MUST include Allow header
      // This is essential for API contract compliance
      expect(mockResponse.set).toHaveBeenCalledWith(HEADERS.ALLOW, HTTP_METHODS.GET);
    });

    /**
     * @description
     * Verifies that 405 responses include the exact "Method Not Allowed" body.
     * Per Section 0.6.4, the exact error message must match the API contract.
     * Transforms: expect(res.end).toHaveBeenCalledWith(MESSAGES.METHOD_NOT_ALLOWED) line 155
     */
    it('should send "Method Not Allowed" message body for 405 responses', () => {
      // Arrange: Create a 405 exception
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify the exact error message was sent
      // CRITICAL: Per Section 0.6.4, exact message must be "Method Not Allowed"
      expect(mockResponse.send).toHaveBeenCalledWith(MESSAGES.METHOD_NOT_ALLOWED);
    });

    /**
     * @description
     * Verifies that 405 exceptions are logged for debugging.
     * Transforms: expect(logger.info).toHaveBeenCalledWith('Responding with 405 Method Not Allowed') line 158
     */
    it('should log 405 Method Not Allowed exception details', () => {
      // Arrange: Create a 405 exception
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify logger was called with appropriate message
      expect(loggerLogSpy).toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('405 Method Not Allowed'));
    });

    /**
     * @description
     * Comprehensive test verifying all 405 response requirements together.
     *
     * This test validates the complete 405 response including:
     * - Correct status code (405)
     * - Content-Type: text/plain header
     * - Allow: GET header (CRITICAL)
     * - Correct message body
     * - Proper method call order
     */
    it('should send complete 405 response with all required headers', () => {
      // Arrange: Create a 405 exception with realistic request context
      mockRequest = createMockRequest('DELETE', '/hello');
      mockHost = createMockArgumentsHost(mockResponse, mockRequest);
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify complete response
      // Status code
      expect(mockResponse.status).toHaveBeenCalledWith(405);

      // Content-Type header (REQUIRED per Section 0.6.4)
      expect(mockResponse.set).toHaveBeenCalledWith(
        HEADERS.CONTENT_TYPE,
        HEADERS.CONTENT_TYPE_TEXT,
      );

      // Allow header (CRITICAL per Section 0.6.4 and RFC 7231)
      expect(mockResponse.set).toHaveBeenCalledWith(HEADERS.ALLOW, HTTP_METHODS.GET);

      // Response body
      expect(mockResponse.send).toHaveBeenCalledWith(MESSAGES.METHOD_NOT_ALLOWED);
    });
  });

  // -------------------------------------------------------------------------
  // Other HTTP Exception Tests
  // -------------------------------------------------------------------------
  // Tests for handling other HTTP exceptions (not 404 or 405)
  // -------------------------------------------------------------------------

  /**
   * @description
   * Test suite for handling other HTTP exceptions that are not 404 or 405.
   *
   * The filter should handle any HttpException and return appropriate
   * responses while maintaining the text/plain content type.
   */
  describe('Other HTTP exception handling', () => {
    /**
     * @description
     * Verifies that 400 Bad Request exceptions are handled correctly.
     */
    it('should handle 400 Bad Request exception', () => {
      // Arrange: Create a 400 Bad Request exception
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify response properties
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.set).toHaveBeenCalledWith(
        HEADERS.CONTENT_TYPE,
        HEADERS.CONTENT_TYPE_TEXT,
      );
      expect(mockResponse.send).toHaveBeenCalledWith('Bad Request');
    });

    /**
     * @description
     * Verifies that 401 Unauthorized exceptions are handled correctly.
     */
    it('should handle 401 Unauthorized exception', () => {
      // Arrange: Create a 401 Unauthorized exception
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.send).toHaveBeenCalledWith('Unauthorized');
    });

    /**
     * @description
     * Verifies that 403 Forbidden exceptions are handled correctly.
     */
    it('should handle 403 Forbidden exception', () => {
      // Arrange: Create a 403 Forbidden exception
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.send).toHaveBeenCalledWith('Forbidden');
    });

    /**
     * @description
     * Verifies that custom exception messages are preserved in response.
     */
    it('should preserve custom exception message in response', () => {
      // Arrange: Create exception with custom message
      const customMessage = 'Custom error occurred';
      const exception = new HttpException(customMessage, HttpStatus.BAD_REQUEST);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Custom message should be in response
      expect(mockResponse.send).toHaveBeenCalledWith(customMessage);
    });

    /**
     * @description
     * Verifies that a warning is logged for non-404/405 HTTP exceptions.
     * These exceptions may need attention as they indicate unusual conditions.
     */
    it('should log warning for other HTTP exceptions', () => {
      // Arrange: Create a non-404/405 exception
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify warning was logged
      // Non-404/405 exceptions get logged with warn level
      expect(loggerWarnSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // ArgumentsHost Context Tests
  // -------------------------------------------------------------------------
  // Tests for NestJS-specific ArgumentsHost behavior
  // -------------------------------------------------------------------------

  /**
   * @description
   * Test suite for ArgumentsHost context handling.
   *
   * These tests verify the filter correctly interacts with the NestJS
   * ArgumentsHost to access HTTP request/response objects.
   */
  describe('ArgumentsHost context handling', () => {
    /**
     * @description
     * Verifies the filter correctly switches to HTTP context.
     * The filter must call switchToHttp() to access web request objects.
     */
    it('should switch to HTTP context to access request/response', () => {
      // Arrange: Create exception and spy on switchToHttp
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      const switchToHttpSpy = jest.spyOn(mockHost, 'switchToHttp');

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Verify switchToHttp was called to access HTTP context
      expect(switchToHttpSpy).toHaveBeenCalled();
    });

    /**
     * @description
     * Verifies request details are used for logging.
     * The filter should include request method and URL in log messages.
     */
    it('should include request details in log messages', () => {
      // Arrange: Set up specific request details
      mockRequest = createMockRequest('POST', '/api/test');
      mockHost = createMockArgumentsHost(mockResponse, mockRequest);
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter's catch method
      filter.catch(exception, mockHost);

      // Assert: Log should include request details
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('/api/test'));
    });
  });

  // -------------------------------------------------------------------------
  // Response Method Chain Tests
  // -------------------------------------------------------------------------
  // Tests verifying correct Express response method chaining
  // -------------------------------------------------------------------------

  /**
   * @description
   * Test suite for response method chaining behavior.
   *
   * Express Response uses a fluent API where methods return 'this'.
   * These tests verify the filter uses the correct method chain.
   */
  describe('Response method chaining', () => {
    /**
     * @description
     * Verifies that response methods are called in correct order.
     * The typical order is: status() -> set() -> send()
     */
    it('should call response methods in correct order for 404', () => {
      // Arrange: Track call order
      const callOrder: string[] = [];
      mockResponse.status = jest.fn().mockImplementation(() => {
        callOrder.push('status');
        return mockResponse;
      });
      mockResponse.set = jest.fn().mockImplementation(() => {
        callOrder.push('set');
        return mockResponse;
      });
      mockResponse.send = jest.fn().mockImplementation(() => {
        callOrder.push('send');
        return mockResponse;
      });

      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act: Call the filter
      filter.catch(exception, mockHost);

      // Assert: Methods should be called in logical order
      expect(callOrder[0]).toBe('status');
      expect(callOrder[callOrder.length - 1]).toBe('send');
    });

    /**
     * @description
     * Verifies that set() is called multiple times for 405 (Content-Type and Allow).
     */
    it('should call set() twice for 405 responses (Content-Type and Allow)', () => {
      // Arrange: Create 405 exception
      const exception = new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);

      // Act: Call the filter
      filter.catch(exception, mockHost);

      // Assert: set() should be called twice - once for Content-Type, once for Allow
      expect(mockResponse.set).toHaveBeenCalledTimes(2);
    });
  });
});
