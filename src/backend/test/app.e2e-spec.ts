/**
 * @fileoverview End-to-end integration tests for NestJS Hello World API
 *
 * This test suite verifies the complete HTTP behavior of the NestJS Hello World
 * application by making actual HTTP requests to a running test application instance.
 * It validates that all API contracts are maintained after the migration from
 * vanilla Node.js to NestJS.
 *
 * @module E2ETests
 *
 * @description
 * End-to-end (e2e) tests validate the entire application stack from HTTP request
 * to response, ensuring all components work together correctly. These tests replace
 * the vanilla Node.js integration tests (src/backend/__tests__/integration/api.test.js)
 * with NestJS-native e2e testing patterns.
 *
 * Key test scenarios covered:
 * - GET /hello → 200 OK with 'Hello world' response
 * - POST /hello → 405 Method Not Allowed with Allow: GET header
 * - PUT /hello → 405 Method Not Allowed with Allow: GET header
 * - DELETE /hello → 405 Method Not Allowed with Allow: GET header
 * - GET / → 200 OK (health check endpoint via AppController)
 * - GET /unknown → 404 Not Found
 *
 * Testing approach:
 * - Uses @nestjs/testing module to create an isolated test application
 * - Uses supertest library for HTTP assertions
 * - Test application is created once before all tests (beforeAll)
 * - Test application is properly closed after all tests (afterAll)
 * - Tests run against the full AppModule configuration
 *
 * Migration notes:
 * - Original: Used request(`http://localhost:${config.port}`)
 * - NestJS: Uses request(app.getHttpServer())
 * - Original: Manual server creation with createServer/startServer
 * - NestJS: Test.createTestingModule() with AppModule
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/fundamentals/testing#end-to-end-testing NestJS E2E Testing}
 * @see {@link https://github.com/ladjs/supertest supertest Documentation}
 * @see src/backend/__tests__/integration/api.test.js - Original vanilla Node.js tests
 *
 * @example
 * // Run these tests with:
 * // npm run test:e2e
 * // or
 * // jest --config ./test/jest-e2e.json
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Import statements organized by source for maintainability.
 * Following the import grouping pattern specified in Section 0.7.1.
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Testing Utilities
// -----------------------------------------------------------------------------
/**
 * Test: Provides createTestingModule() method to bootstrap the application
 * in complete isolation from the production server. This replaces the
 * manual server setup from vanilla Node.js (createServer, startServer).
 *
 * TestingModule: TypeScript interface for the compiled module returned by
 * Test.createTestingModule().compile(). Provides access to:
 * - createNestApplication(): Creates the test app instance
 * - get(): Retrieves providers from the DI container (if needed)
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * INestApplication: TypeScript interface for the NestJS application instance.
 * Used to type the 'app' variable that holds the test application.
 * Provides type-safe access to critical methods:
 * - getHttpServer(): Returns the underlying HTTP server for supertest
 * - init(): Initializes the application (starts listening)
 * - close(): Closes the application (releases resources)
 */
import { INestApplication } from '@nestjs/common';

// -----------------------------------------------------------------------------
// HTTP Testing Library
// -----------------------------------------------------------------------------
/**
 * supertest: HTTP testing library for making requests to the test server.
 * Uses default import pattern for TypeScript/ES module compatibility.
 *
 * Key methods used:
 * - request(server): Creates a request agent for the given server
 * - .get(path): Makes a GET request to the specified path
 * - .post(path): Makes a POST request to the specified path
 * - .put(path): Makes a PUT request to the specified path
 * - .delete(path): Makes a DELETE request to the specified path
 * - .expect(status): Asserts the expected HTTP status code
 * - .expect(header, value): Asserts the expected header value
 *
 * This replaces the direct URL-based requests from vanilla Node.js:
 * - Old: request(`http://localhost:${config.port}`)
 * - New: request(app.getHttpServer())
 *
 * Note: Default import is used instead of namespace import (* as) because
 * the @types/supertest definitions export the main function as default.
 * This is compatible with tsconfig settings: esModuleInterop: true and
 * allowSyntheticDefaultImports: true.
 */
import request from 'supertest';

// -----------------------------------------------------------------------------
// Application Module
// -----------------------------------------------------------------------------
/**
 * AppModule: Root NestJS application module containing all feature modules.
 *
 * This module includes:
 * - AppConfigModule: Environment-based configuration (PORT, NODE_ENV)
 * - HelloModule: The /hello endpoint feature module
 * - AppController: Root-level health check endpoint
 * - AppService: Root-level application services
 *
 * By importing the full AppModule, we test the complete application
 * configuration as it runs in production. This ensures:
 * - All routes are properly registered
 * - All providers are correctly injected
 * - All filters/guards/interceptors are applied
 *
 * @see src/backend/src/app.module.ts
 */
import { AppModule } from '../src/app.module';

// -----------------------------------------------------------------------------
// Exception Filters
// -----------------------------------------------------------------------------
/**
 * HttpExceptionFilter: Global exception filter for HTTP-specific errors.
 * Handles 404 Not Found and 405 Method Not Allowed with proper plain text
 * responses and required headers (e.g., Allow header for 405 responses).
 *
 * AllExceptionsFilter: Catch-all filter for unhandled exceptions.
 * Ensures all errors return consistent 500 Internal Server Error responses.
 *
 * IMPORTANT: These filters must be manually registered in e2e tests because
 * the Test.createTestingModule() method doesn't call the main.ts bootstrap
 * function where global filters are normally registered.
 *
 * @see src/backend/src/common/filters/http-exception.filter.ts
 * @see src/backend/src/common/filters/all-exceptions.filter.ts
 */
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/* ============================================================================
 * E2E TEST SUITE
 * ============================================================================
 * Tests the complete HTTP behavior of the NestJS Hello World application.
 * This suite validates all API contracts are preserved after migration.
 * ============================================================================ */

/**
 * End-to-end test suite for the NestJS Hello World API
 *
 * @description
 * This test suite creates a complete NestJS application instance and makes
 * real HTTP requests to test all endpoints. It validates the following
 * functional requirements:
 *
 * 1. **GET /hello** - Returns 'Hello world' with 200 OK status
 *    - Content-Type: text/plain
 *    - Body: 'Hello world'
 *
 * 2. **Non-GET /hello** - Returns 405 Method Not Allowed
 *    - Content-Type: text/plain
 *    - Allow header: GET
 *    - Body: Contains 'Method Not Allowed'
 *
 * 3. **GET /** - Returns health status with 200 OK
 *    - Handled by AppController.getHealth()
 *
 * 4. **Unknown routes** - Returns 404 Not Found
 *    - Content-Type: text/plain
 *    - Body: Contains 'Not Found'
 *
 * Test lifecycle:
 * - beforeAll: Creates and initializes the test application
 * - Each test: Makes HTTP request and validates response
 * - afterAll: Closes the application to release resources
 *
 * @example
 * // Running specific tests
 * npm run test:e2e -- --testNamePattern="GET /hello"
 */
describe('AppController (e2e)', () => {
  // ---------------------------------------------------------------------------
  // Test Application Instance
  // ---------------------------------------------------------------------------

  /**
   * The NestJS application instance used for all e2e tests.
   *
   * @description
   * This variable holds the test application created by TestingModule.
   * It is initialized in beforeAll() and closed in afterAll().
   *
   * Key characteristics:
   * - Created from the full AppModule (production configuration)
   * - Provides access to getHttpServer() for supertest requests
   * - Must be closed after tests to prevent resource leaks
   *
   * Type: INestApplication ensures type-safe access to:
   * - getHttpServer(): Returns the underlying HTTP server
   * - init(): Initializes the application
   * - close(): Closes the application
   */
  let app: INestApplication;

  // ---------------------------------------------------------------------------
  // Test Setup (beforeAll)
  // ---------------------------------------------------------------------------

  /**
   * Creates and initializes the test application before all tests run.
   *
   * @description
   * This setup function performs the following steps:
   *
   * 1. Creates a TestingModule with the full AppModule
   *    - This mirrors the production bootstrap process in main.ts
   *    - Includes all feature modules (HelloModule, ConfigModule)
   *    - Includes all providers, controllers, and filters
   *
   * 2. Compiles the testing module
   *    - Resolves all dependencies in the DI container
   *    - Validates module configuration
   *
   * 3. Creates a NestJS application from the compiled module
   *    - Returns an INestApplication instance
   *    - Does not start listening yet
   *
   * 4. Initializes the application
   *    - Starts the HTTP server
   *    - Registers all routes
   *    - Applies all global middleware/filters
   *
   * @async
   * @returns {Promise<void>} Resolves when app is fully initialized
   *
   * @example
   * // The beforeAll hook runs once before all tests in this describe block
   * // After this completes, app.getHttpServer() returns a valid HTTP server
   */
  beforeAll(async () => {
    // Create the testing module with the full application module
    // This replaces the manual server setup from vanilla Node.js:
    // - Old: const serverInstance = createServer(); await startServer(serverInstance);
    // - New: Test.createTestingModule({ imports: [AppModule] })
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Import the root module with all dependencies
      // AppModule includes: ConfigModule, HelloModule, AppController, AppService
      imports: [AppModule],
    }).compile();

    // Create the NestJS application from the compiled module
    // This is equivalent to NestFactory.create(AppModule) in main.ts
    app = moduleFixture.createNestApplication();

    // -------------------------------------------------------------------------
    // Register Global Exception Filters
    // -------------------------------------------------------------------------
    // IMPORTANT: Global filters registered in main.ts via app.useGlobalFilters()
    // are NOT automatically applied when using Test.createTestingModule().
    // We must manually register them here to maintain the same error handling
    // behavior as the production application.
    //
    // Filter registration order (LIFO - Last In, First Out):
    // 1. AllExceptionsFilter (registered first, tried last as catch-all)
    // 2. HttpExceptionFilter (registered second, tried first for HTTP errors)
    //
    // This ensures:
    // - 404 responses have text/plain Content-Type and "Not Found" body
    // - 405 responses have text/plain Content-Type, Allow header, and proper body
    // - All other HTTP exceptions are handled consistently
    // -------------------------------------------------------------------------
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    // Initialize the application - this starts the HTTP server
    // After this call, the app is ready to receive HTTP requests
    // Note: Global filters are now registered and will be active
    await app.init();
  });

  // ---------------------------------------------------------------------------
  // Test Teardown (afterAll)
  // ---------------------------------------------------------------------------

  /**
   * Closes the test application after all tests complete.
   *
   * @description
   * Properly closes the NestJS application to:
   * - Release all resources (file handles, connections, etc.)
   * - Stop the HTTP server
   * - Allow Jest to exit cleanly without hanging handles
   *
   * This is critical because:
   * - Unclosed applications cause Jest --forceExit warnings
   * - CI/CD pipelines may timeout with hanging processes
   * - Resources may be exhausted if many test suites run
   *
   * @async
   * @returns {Promise<void>} Resolves when app is fully closed
   *
   * @example
   * // The afterAll hook runs once after all tests complete
   * // This ensures clean shutdown regardless of test results
   */
  afterAll(async () => {
    // Close the application and release all resources
    // This is equivalent to: server.close() in vanilla Node.js
    await app.close();
  });

  /* ===========================================================================
   * /hello ENDPOINT TESTS
   * ===========================================================================
   * Tests all HTTP methods against the /hello endpoint to verify:
   * - GET returns 'Hello world' with 200 OK
   * - Non-GET methods return 405 Method Not Allowed with proper headers
   * =========================================================================== */

  /**
   * Test suite for the /hello endpoint
   *
   * @description
   * The /hello endpoint is the primary feature of this application.
   * These tests verify:
   *
   * - Success case: GET returns 'Hello world' with 200 OK
   * - Error cases: POST, PUT, DELETE, PATCH return 405 Method Not Allowed
   *
   * This mirrors the original vanilla Node.js tests that verified
   * helloHandler.js behavior. The responses should be identical.
   */
  describe('/hello endpoint', () => {
    // -------------------------------------------------------------------------
    // GET /hello - Success Case
    // -------------------------------------------------------------------------

    /**
     * Verifies GET /hello returns 200 OK with 'Hello world' message.
     *
     * @description
     * This is the primary success test case for the Hello World API.
     *
     * Expected behavior:
     * - HTTP status code: 200 OK
     * - Content-Type header: text/plain
     * - Response body: 'Hello world' (exact match)
     *
     * This test ensures backward compatibility with the original
     * vanilla Node.js implementation (helloHandler.js).
     *
     * Migration notes:
     * - Old: request(`http://localhost:${config.port}`).get(ROUTES.HELLO)
     * - New: request(app.getHttpServer()).get('/hello')
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('GET /hello should return 200 OK with "Hello world"', async () => {
      // Make GET request to /hello endpoint using supertest
      // app.getHttpServer() returns the underlying HTTP server for testing
      const response = await request(app.getHttpServer())
        .get('/hello')
        // Verify HTTP 200 OK status code
        .expect(200)
        // Verify Content-Type header is text/plain (with optional charset)
        .expect('Content-Type', /text\/plain/);

      // Verify the response body is exactly 'Hello world'
      // This matches the original MESSAGES.HELLO_RESPONSE constant
      expect(response.text).toBe('Hello world');
    });

    // -------------------------------------------------------------------------
    // POST /hello - Method Not Allowed
    // -------------------------------------------------------------------------

    /**
     * Verifies POST /hello returns 405 Method Not Allowed.
     *
     * @description
     * Tests that POST requests to /hello are rejected with:
     * - HTTP status code: 405 Method Not Allowed
     * - Content-Type header: text/plain
     * - Allow header: GET (RFC 7231 requirement)
     * - Response body: Contains 'Method Not Allowed'
     *
     * This maintains the API contract from the original helloHandler.js
     * where non-GET methods triggered handle405() from errorHandler.js.
     *
     * RFC 7231 requirement:
     * "An origin server that generates a 405 response MUST send an Allow
     * header field in that response containing a list of the target
     * resource's currently supported methods."
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('POST /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .post('/hello')
        // Verify HTTP 405 Method Not Allowed status
        .expect(405)
        // Verify Content-Type header
        .expect('Content-Type', /text\/plain/)
        // Verify Allow header (RFC 7231 requirement)
        .expect('Allow', 'GET');

      // Verify response body contains the error message
      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // PUT /hello - Method Not Allowed
    // -------------------------------------------------------------------------

    /**
     * Verifies PUT /hello returns 405 Method Not Allowed.
     *
     * @description
     * Tests that PUT requests to /hello are rejected with proper 405 response.
     * Same expectations as POST /hello test.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('PUT /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .put('/hello')
        // Verify HTTP 405 Method Not Allowed status
        .expect(405)
        // Verify Content-Type header
        .expect('Content-Type', /text\/plain/)
        // Verify Allow header (RFC 7231 requirement)
        .expect('Allow', 'GET');

      // Verify response body contains the error message
      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // DELETE /hello - Method Not Allowed
    // -------------------------------------------------------------------------

    /**
     * Verifies DELETE /hello returns 405 Method Not Allowed.
     *
     * @description
     * Tests that DELETE requests to /hello are rejected with proper 405 response.
     * Same expectations as POST /hello test.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('DELETE /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .delete('/hello')
        // Verify HTTP 405 Method Not Allowed status
        .expect(405)
        // Verify Content-Type header
        .expect('Content-Type', /text\/plain/)
        // Verify Allow header (RFC 7231 requirement)
        .expect('Allow', 'GET');

      // Verify response body contains the error message
      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // PATCH /hello - Method Not Allowed
    // -------------------------------------------------------------------------

    /**
     * Verifies PATCH /hello returns 405 Method Not Allowed.
     *
     * @description
     * Tests that PATCH requests to /hello are rejected with proper 405 response.
     * This extends the original tests which only covered POST, PUT, DELETE.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('PATCH /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .patch('/hello')
        // Verify HTTP 405 Method Not Allowed status
        .expect(405)
        // Verify Content-Type header
        .expect('Content-Type', /text\/plain/)
        // Verify Allow header (RFC 7231 requirement)
        .expect('Allow', 'GET');

      // Verify response body contains the error message
      expect(response.text).toContain('Method Not Allowed');
    });
  });

  /* ===========================================================================
   * ROOT ENDPOINT TESTS (HEALTH CHECK)
   * ===========================================================================
   * Tests the health check endpoint at the root path (/).
   * This endpoint is handled by AppController.getHealth().
   * =========================================================================== */

  /**
   * Test suite for the root (/) endpoint
   *
   * @description
   * Tests the health check endpoint at the root path.
   * This endpoint is handled by AppController in the NestJS implementation.
   *
   * The health check allows external monitoring systems (like Docker,
   * Kubernetes, or load balancers) to verify the application is running.
   */
  describe('/ (root) endpoint', () => {
    /**
     * Verifies GET / returns 200 OK (health check).
     *
     * @description
     * Tests that the root endpoint returns a successful health status.
     * This is handled by AppController.getHealth() which delegates to AppService.
     *
     * Expected behavior:
     * - HTTP status code: 200 OK
     * - Response indicates the service is healthy
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('GET / should return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        // Verify HTTP 200 OK status
        .expect(200);

      // Response should indicate healthy status
      // The exact value depends on AppService.getHealth() implementation
      expect(response.text).toBeDefined();
    });
  });

  /* ===========================================================================
   * UNKNOWN ROUTE TESTS (404 NOT FOUND)
   * ===========================================================================
   * Tests that requests to undefined routes return 404 Not Found.
   * This validates the global exception filter handles missing routes correctly.
   * =========================================================================== */

  /**
   * Test suite for unknown routes
   *
   * @description
   * Tests that requests to non-existent routes are properly handled:
   * - HTTP status code: 404 Not Found
   * - Content-Type: text/plain
   * - Response body: Contains 'Not Found'
   *
   * This maintains the API contract from the original implementation
   * where handle404() from errorHandler.js handled unknown routes.
   */
  describe('Unknown routes', () => {
    /**
     * Verifies GET /unknown returns 404 Not Found.
     *
     * @description
     * Tests that requests to non-existent routes are properly rejected.
     * This replaces the original test from api.test.js:
     * - Old: request(`http://localhost:${config.port}`).get('/undefined')
     * - New: request(app.getHttpServer()).get('/unknown')
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('GET /unknown should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .get('/unknown')
        // Verify HTTP 404 Not Found status
        .expect(404)
        // Verify Content-Type header
        .expect('Content-Type', /text\/plain/);

      // Verify response body contains the error message
      expect(response.text).toContain('Not Found');
    });

    /**
     * Verifies GET /non-existent-path returns 404 Not Found.
     *
     * @description
     * Additional test with a different path to ensure 404 handling
     * is consistent across all undefined routes, not just '/unknown'.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('GET /non-existent-path should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-path')
        // Verify HTTP 404 Not Found status
        .expect(404);

      // Verify response body contains the error message
      expect(response.text).toContain('Not Found');
    });

    /**
     * Verifies POST /unknown returns 404 Not Found.
     *
     * @description
     * Tests that POST requests to unknown routes also return 404.
     *
     * Note: Only registered routes return 405 for wrong methods.
     * Unknown routes return 404 regardless of HTTP method because
     * there's no route registered to determine allowed methods.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('POST /unknown should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .post('/unknown')
        // Verify HTTP 404 Not Found (not 405)
        .expect(404);

      // Verify response body contains the error message
      expect(response.text).toContain('Not Found');
    });
  });

  /* ===========================================================================
   * RESPONSE FORMAT VALIDATION TESTS
   * ===========================================================================
   * Tests that responses maintain consistent formatting across all endpoints.
   * Validates Content-Type headers and response body formats.
   * =========================================================================== */

  /**
   * Test suite for response format validation
   *
   * @description
   * Tests that responses maintain consistent formatting:
   * - Content-Type headers are properly set
   * - Allow headers are present for 405 responses (RFC 7231)
   * - Response bodies follow expected patterns
   *
   * Consistent response formatting is important for:
   * - Client-side parsing logic
   * - API documentation accuracy
   * - Backward compatibility
   */
  describe('Response format validation', () => {
    /**
     * Verifies Content-Type header is text/plain for success responses.
     *
     * @description
     * All successful responses should have text/plain Content-Type.
     * This ensures clients can correctly parse the response body.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('should set Content-Type to text/plain for /hello', async () => {
      const response = await request(app.getHttpServer()).get('/hello');

      // Content-Type should be text/plain with optional charset
      // Examples: 'text/plain', 'text/plain; charset=utf-8'
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    /**
     * Verifies Content-Type header is text/plain for error responses.
     *
     * @description
     * Even error responses should maintain text/plain Content-Type
     * for consistency with the original vanilla Node.js implementation.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('should set Content-Type to text/plain for 404 errors', async () => {
      const response = await request(app.getHttpServer()).get('/undefined');

      // Even error responses should have text/plain Content-Type
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    /**
     * Verifies Allow header is present for 405 responses.
     *
     * @description
     * RFC 7231 Section 6.5.5 requires:
     * "An origin server that generates a 405 response MUST send an
     * Allow header field in that response containing a list of the
     * target resource's currently supported methods."
     *
     * For /hello, only GET is allowed, so Allow header must be 'GET'.
     *
     * @async
     * @returns {Promise<void>} Resolves when assertions complete
     */
    it('should include Allow header for 405 responses', async () => {
      const response = await request(app.getHttpServer()).post('/hello');

      // 405 responses MUST include Allow header per RFC 7231
      expect(response.headers['allow']).toBe('GET');
    });
  });
});
