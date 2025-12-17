/**
 * @fileoverview End-to-end integration tests for NestJS Hello World API
 *
 * This test suite verifies the complete HTTP behavior of the NestJS Hello World
 * application by making actual HTTP requests to a running test application instance.
 * It validates that all API contracts are maintained after the migration from
 * vanilla Node.js to NestJS.
 *
 * @module E2E Tests
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
 * - PATCH /hello → 405 Method Not Allowed with Allow: GET header
 * - GET / → 200 OK (health check endpoint)
 * - GET /unknown → 404 Not Found
 *
 * Testing approach:
 * - Uses @nestjs/testing module to create an isolated test application
 * - Uses supertest library for HTTP assertions
 * - Test application is created once before all tests (beforeAll)
 * - Test application is properly closed after all tests (afterAll)
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/fundamentals/testing#end-to-end-testing NestJS E2E Testing}
 * @see {@link https://github.com/ladjs/supertest supertest Documentation}
 * @see src/backend/__tests__/integration/api.test.js - Original vanilla Node.js tests
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Import statements organized by source for maintainability
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Testing Utilities
// -----------------------------------------------------------------------------
// Test: Provides createTestingModule() for bootstrapping the app in isolation
// TestingModule: Interface for the compiled module, gives access to createNestApplication()
import { Test, TestingModule } from '@nestjs/testing';

// INestApplication: TypeScript interface for the NestJS app instance
// Provides getHttpServer(), init(), and close() methods
import { INestApplication } from '@nestjs/common';

// -----------------------------------------------------------------------------
// HTTP Testing Library
// -----------------------------------------------------------------------------
// supertest: Makes HTTP requests to the test server and provides assertions
// Uses default import pattern for TypeScript compatibility with esModuleInterop
import request from 'supertest';

// -----------------------------------------------------------------------------
// Application Module
// -----------------------------------------------------------------------------
// AppModule: Root NestJS module containing all feature modules (HelloModule, ConfigModule)
// Imported to create a complete test application instance
import { AppModule } from '../src/app.module';

// -----------------------------------------------------------------------------
// Exception Filters (for complete application setup)
// -----------------------------------------------------------------------------
// Import exception filters to register them in the test app just like production
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/* ============================================================================
 * E2E TEST SUITE
 * ============================================================================
 * Tests the complete HTTP behavior of the NestJS Hello World application
 * ============================================================================ */

/**
 * End-to-end test suite for the NestJS Hello World API
 *
 * @description
 * This test suite creates a complete NestJS application instance and makes
 * real HTTP requests to test all endpoints. It validates:
 *
 * 1. **GET /hello** - Returns 'Hello world' with 200 OK status
 * 2. **Non-GET /hello** - Returns 405 Method Not Allowed with Allow header
 * 3. **GET /** - Returns health status with 200 OK
 * 4. **Unknown routes** - Returns 404 Not Found
 *
 * The test application is created once before all tests run (beforeAll)
 * and properly closed after all tests complete (afterAll) to avoid
 * resource leaks and hanging handles.
 */
describe('AppController (e2e)', () => {
  // ---------------------------------------------------------------------------
  // Test Application Instance
  // ---------------------------------------------------------------------------
  /**
   * The NestJS application instance used for all e2e tests
   *
   * @description
   * This variable holds the test application created by TestingModule.
   * It is initialized in beforeAll() and closed in afterAll().
   * All HTTP requests use app.getHttpServer() to get the underlying HTTP server.
   */
  let app: INestApplication;

  // ---------------------------------------------------------------------------
  // Test Setup (beforeAll)
  // ---------------------------------------------------------------------------
  /**
   * Creates and initializes the test application before all tests
   *
   * @description
   * This setup function:
   * 1. Creates a TestingModule with the full AppModule (production configuration)
   * 2. Creates a NestJS application from the testing module
   * 3. Registers global exception filters (matching production setup in main.ts)
   * 4. Initializes the application to start listening for requests
   *
   * Using the full AppModule ensures tests run against the actual application
   * configuration, including all modules, controllers, services, and filters.
   */
  beforeAll(async () => {
    // Create the testing module with the full application module
    // This mirrors the production bootstrap process in main.ts
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Import the root module with all dependencies
    }).compile();

    // Create the NestJS application from the compiled module
    app = moduleFixture.createNestApplication();

    // Register global exception filters to match production behavior
    // This ensures 404 and 405 responses are formatted correctly
    app.useGlobalFilters(
      new AllExceptionsFilter(), // Catch-all filter for unexpected errors (500)
      new HttpExceptionFilter(), // HTTP-specific filter (404, 405, etc.)
    );

    // Initialize the application - this starts the HTTP server
    await app.init();
  });

  // ---------------------------------------------------------------------------
  // Test Teardown (afterAll)
  // ---------------------------------------------------------------------------
  /**
   * Closes the test application after all tests complete
   *
   * @description
   * Properly closes the NestJS application to:
   * - Release all resources (file handles, connections, etc.)
   * - Stop the HTTP server
   * - Allow Jest to exit cleanly without hanging handles
   *
   * This is critical for CI/CD pipelines where hanging processes can
   * cause job timeouts or resource exhaustion.
   */
  afterAll(async () => {
    // Close the application and release all resources
    await app.close();
  });

  // ===========================================================================
  // /hello Endpoint Tests
  // ===========================================================================

  /**
   * Test suite for the /hello endpoint
   *
   * @description
   * Tests all HTTP methods against the /hello endpoint to verify:
   * - GET returns 'Hello world' with 200 OK
   * - Non-GET methods return 405 Method Not Allowed with proper headers
   */
  describe('/hello endpoint', () => {
    // -------------------------------------------------------------------------
    // GET /hello - Success Case
    // -------------------------------------------------------------------------
    /**
     * Verifies GET /hello returns 200 OK with 'Hello world' message
     *
     * @description
     * This is the primary success test case for the Hello World API.
     * It validates:
     * - HTTP status code is 200 OK
     * - Content-Type header is text/plain
     * - Response body is exactly 'Hello world'
     *
     * This test ensures backward compatibility with the original
     * vanilla Node.js implementation (helloHandler.js).
     */
    it('GET /hello should return 200 OK with "Hello world"', async () => {
      const response = await request(app.getHttpServer())
        .get('/hello')
        .expect(200) // Verify HTTP 200 OK status
        .expect('Content-Type', /text\/plain/); // Verify Content-Type header

      // Verify the response body is exactly 'Hello world'
      expect(response.text).toBe('Hello world');
    });

    // -------------------------------------------------------------------------
    // POST /hello - Method Not Allowed
    // -------------------------------------------------------------------------
    /**
     * Verifies POST /hello returns 405 Method Not Allowed
     *
     * @description
     * Tests that POST requests to /hello are rejected with:
     * - HTTP status code 405 Method Not Allowed
     * - Allow header set to 'GET' (RFC 7231 requirement)
     * - Response body contains 'Method Not Allowed'
     *
     * This maintains the API contract from the original helloHandler.js
     * where non-GET methods triggered handle405() from errorHandler.js.
     */
    it('POST /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .post('/hello')
        .expect(405) // Verify HTTP 405 Method Not Allowed
        .expect('Content-Type', /text\/plain/) // Verify Content-Type
        .expect('Allow', 'GET'); // Verify Allow header (RFC 7231 requirement)

      // Verify response body contains the error message
      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // PUT /hello - Method Not Allowed
    // -------------------------------------------------------------------------
    /**
     * Verifies PUT /hello returns 405 Method Not Allowed
     *
     * @description
     * Tests that PUT requests to /hello are rejected with proper 405 response.
     */
    it('PUT /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .put('/hello')
        .expect(405)
        .expect('Content-Type', /text\/plain/)
        .expect('Allow', 'GET');

      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // DELETE /hello - Method Not Allowed
    // -------------------------------------------------------------------------
    /**
     * Verifies DELETE /hello returns 405 Method Not Allowed
     *
     * @description
     * Tests that DELETE requests to /hello are rejected with proper 405 response.
     */
    it('DELETE /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .delete('/hello')
        .expect(405)
        .expect('Content-Type', /text\/plain/)
        .expect('Allow', 'GET');

      expect(response.text).toContain('Method Not Allowed');
    });

    // -------------------------------------------------------------------------
    // PATCH /hello - Method Not Allowed
    // -------------------------------------------------------------------------
    /**
     * Verifies PATCH /hello returns 405 Method Not Allowed
     *
     * @description
     * Tests that PATCH requests to /hello are rejected with proper 405 response.
     */
    it('PATCH /hello should return 405 Method Not Allowed', async () => {
      const response = await request(app.getHttpServer())
        .patch('/hello')
        .expect(405)
        .expect('Content-Type', /text\/plain/)
        .expect('Allow', 'GET');

      expect(response.text).toContain('Method Not Allowed');
    });
  });

  // ===========================================================================
  // Root Endpoint Tests (Health Check)
  // ===========================================================================

  /**
   * Test suite for the root (/) endpoint
   *
   * @description
   * Tests the health check endpoint at the root path.
   * In the NestJS implementation, this returns 'OK' status.
   */
  describe('/ (root) endpoint', () => {
    /**
     * Verifies GET / returns 200 OK (health check)
     *
     * @description
     * Tests that the root endpoint returns a successful health status.
     * This is handled by AppController.getHealth() which delegates to AppService.
     */
    it('GET / should return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200); // Verify HTTP 200 OK status

      // Response should be the health status string
      expect(response.text).toBe('OK');
    });
  });

  // ===========================================================================
  // Unknown Route Tests (404 Not Found)
  // ===========================================================================

  /**
   * Test suite for unknown routes
   *
   * @description
   * Tests that requests to undefined routes return 404 Not Found.
   * This validates the global exception filter handles missing routes correctly.
   */
  describe('Unknown routes', () => {
    /**
     * Verifies GET /unknown returns 404 Not Found
     *
     * @description
     * Tests that requests to non-existent routes are properly handled:
     * - HTTP status code 404 Not Found
     * - Response body contains 'Not Found'
     *
     * This maintains the API contract from the original implementation
     * where handle404() from errorHandler.js handled unknown routes.
     */
    it('GET /unknown should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .get('/unknown')
        .expect(404) // Verify HTTP 404 Not Found
        .expect('Content-Type', /text\/plain/); // Verify Content-Type

      // Verify response body contains the error message
      expect(response.text).toContain('Not Found');
    });

    /**
     * Verifies GET /non-existent-path returns 404 Not Found
     *
     * @description
     * Additional test with a different path to ensure 404 handling is consistent.
     */
    it('GET /non-existent-path should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-path')
        .expect(404);

      expect(response.text).toContain('Not Found');
    });

    /**
     * Verifies POST /unknown returns 404 Not Found
     *
     * @description
     * Tests that POST requests to unknown routes also return 404.
     * Note: Only registered routes return 405 for wrong methods.
     * Unknown routes return 404 regardless of HTTP method.
     */
    it('POST /unknown should return 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .post('/unknown')
        .expect(404);

      expect(response.text).toContain('Not Found');
    });
  });

  // ===========================================================================
  // Response Format Tests
  // ===========================================================================

  /**
   * Test suite for response format validation
   *
   * @description
   * Tests that responses maintain consistent formatting across all endpoints.
   * Validates Content-Type headers and response body formats.
   */
  describe('Response format validation', () => {
    /**
     * Verifies Content-Type header is text/plain for success responses
     */
    it('should set Content-Type to text/plain for /hello', async () => {
      const response = await request(app.getHttpServer()).get('/hello');

      // Content-Type should be text/plain with optional charset
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    /**
     * Verifies Content-Type header is text/plain for error responses
     */
    it('should set Content-Type to text/plain for 404 errors', async () => {
      const response = await request(app.getHttpServer()).get('/undefined');

      // Even error responses should have text/plain Content-Type
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    /**
     * Verifies Allow header is present for 405 responses
     */
    it('should include Allow header for 405 responses', async () => {
      const response = await request(app.getHttpServer()).post('/hello');

      // 405 responses MUST include Allow header per RFC 7231
      expect(response.headers['allow']).toBe('GET');
    });
  });
});
