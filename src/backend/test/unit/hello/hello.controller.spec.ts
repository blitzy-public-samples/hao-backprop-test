/**
 * @fileoverview Unit tests for HelloController
 *
 * This test file validates the HelloController functionality using NestJS's
 * testing utilities. It transforms the vanilla Node.js helloHandler.test.js
 * testing approach into NestJS's controller testing pattern with proper
 * dependency injection mocking.
 *
 * @module HelloController Tests
 *
 * @description
 * The HelloController test suite verifies:
 * - Controller instantiation and dependency injection
 * - GET /hello endpoint returns 'Hello world' message
 * - HelloService integration and method delegation
 * - Proper service method invocation
 *
 * Key transformations from original helloHandler.test.js:
 * - Manual req/res mock objects → NestJS Test.createTestingModule()
 * - Direct function calls → Controller method invocation
 * - Jest mocks for errorHandler → NestJS built-in 405 handling (implicit)
 * - logger mocks → NestJS Logger (internal, no mocking needed)
 *
 * Original source file: src/backend/__tests__/handlers/helloHandler.test.js
 * This file contained tests for handleHelloRequest() function with manual
 * HTTP request/response mocking. NestJS controllers abstract away HTTP
 * details, so our tests focus on method behavior and DI verification.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/fundamentals/testing NestJS Testing}
 * @see {@link https://jestjs.io/docs/jest-object Jest Mock Functions}
 *
 * @example
 * // Run tests with Jest
 * npm test -- --testPathPattern=hello.controller.spec.ts
 *
 * @example
 * // Run with coverage
 * npm test -- --coverage --testPathPattern=hello.controller.spec.ts
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS testing utilities, controller, service
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Testing Utilities
// -----------------------------------------------------------------------------
// Test and TestingModule are the core NestJS testing utilities
// - Test: Provides createTestingModule() for bootstrapping isolated modules
// - TestingModule: The compiled module interface with get() for retrieving instances
// These replace the manual module imports and mock setup from helloHandler.test.js
import { Test, TestingModule } from '@nestjs/testing';

// -----------------------------------------------------------------------------
// Controller Under Test
// -----------------------------------------------------------------------------
// HelloController is the controller class being tested
// It handles HTTP requests to the /hello endpoint with @Get() decorator
// Replaces testing of handleHelloRequest(req, res) from helloHandler.js
import { HelloController } from '../../../src/hello/hello.controller';

// -----------------------------------------------------------------------------
// Service Dependency
// -----------------------------------------------------------------------------
// HelloService is injected into HelloController via NestJS DI
// We register it in the testing module to enable proper dependency injection
// This allows us to spy on service methods and verify controller-service interaction
import { HelloService } from '../../../src/hello/hello.service';

/* ============================================================================
 * TEST SUITE: HelloController
 * ============================================================================
 * Comprehensive unit tests for the HelloController class
 *
 * Test Organization:
 * 1. Controller instantiation verification
 * 2. getHello() method behavior tests
 * 3. Service dependency injection verification
 * 4. Service method delegation verification
 *
 * Note on 405 Method Not Allowed:
 * In the original helloHandler.test.js, we tested that non-GET methods
 * triggered handle405(). In NestJS, this is handled automatically by
 * the framework when only @Get() is decorated. This behavior is tested
 * in e2e tests rather than unit tests, as it requires HTTP layer testing.
 * ============================================================================ */
describe('HelloController', () => {
  /* --------------------------------------------------------------------------
   * TEST VARIABLES
   * --------------------------------------------------------------------------
   * Controller and service instances retrieved from the testing module
   * -------------------------------------------------------------------------- */

  /**
   * Controller instance under test
   * Retrieved from the compiled TestingModule using module.get()
   * This is the actual HelloController instance with injected dependencies
   */
  let controller: HelloController;

  /**
   * Service instance for verifying dependency injection
   * Retrieved from the same TestingModule to access the injected service
   * Used for spying on service methods to verify controller delegation
   */
  let service: HelloService;

  /* --------------------------------------------------------------------------
   * TEST MODULE SETUP
   * --------------------------------------------------------------------------
   * beforeEach hook creates a fresh testing module for each test
   *
   * This replaces the manual mock setup from helloHandler.test.js:
   * - Lines 42-54: Manual req/res mock objects
   * - Lines 26-34: Jest mock for errorHandler and logger
   *
   * NestJS Test.createTestingModule() provides:
   * - Automatic dependency injection container
   * - Module isolation for unit testing
   * - Easy access to controller and service instances
   * -------------------------------------------------------------------------- */
  beforeEach(async () => {
    /**
     * Create a NestJS testing module with HelloController and HelloService
     *
     * The Test.createTestingModule() method creates an isolated module
     * that mimics the real HelloModule but in a test environment.
     *
     * Providers array includes:
     * - HelloController: The controller class under test
     * - HelloService: The service dependency (real implementation)
     *
     * Note: We use the real HelloService here instead of a mock because
     * the service logic is simple and we want to test the full integration.
     * For more complex services, you would use a mock provider:
     *
     * @example Mock service provider
     * providers: [
     *   HelloController,
     *   {
     *     provide: HelloService,
     *     useValue: { getHello: jest.fn().mockReturnValue('Mocked Hello') },
     *   },
     * ]
     */
    const module: TestingModule = await Test.createTestingModule({
      // Register controller and its dependencies as providers
      // NestJS DI will wire HelloService into HelloController's constructor
      controllers: [HelloController],
      providers: [HelloService],
    }).compile(); // Compile the module to instantiate all providers

    /**
     * Retrieve the HelloController instance from the compiled module
     *
     * module.get<T>() retrieves an instance by its class token
     * This gives us the actual controller with HelloService injected
     *
     * Replaces: Direct function import from helloHandler.js
     * const { handleHelloRequest } = require('../../handlers/helloHandler');
     */
    controller = module.get<HelloController>(HelloController);

    /**
     * Retrieve the HelloService instance for dependency verification
     *
     * Getting the same service instance that was injected into the controller
     * allows us to spy on its methods and verify the controller calls them
     */
    service = module.get<HelloService>(HelloService);
  });

  /* --------------------------------------------------------------------------
   * TEST: Controller Instantiation
   * --------------------------------------------------------------------------
   * Verifies that the controller is properly instantiated by NestJS DI
   * -------------------------------------------------------------------------- */

  /**
   * Test: Controller should be defined
   *
   * @description
   * Verifies that the HelloController was successfully instantiated by the
   * NestJS dependency injection container. This is a fundamental test that
   * confirms the testing module setup is correct.
   *
   * This test catches issues like:
   * - Missing providers in the module
   * - Circular dependencies
   * - Injectable decorator missing from service
   */
  it('should be defined', () => {
    // Verify the controller instance exists and is not null/undefined
    // This confirms NestJS DI successfully created the controller
    expect(controller).toBeDefined();
  });

  /* --------------------------------------------------------------------------
   * TEST: Service Dependency Injection
   * --------------------------------------------------------------------------
   * Verifies that HelloService is properly injected into the controller
   * -------------------------------------------------------------------------- */

  /**
   * Test: HelloService should be injected
   *
   * @description
   * Verifies that the HelloService dependency was correctly injected into
   * the HelloController via constructor injection. This ensures the NestJS
   * dependency injection container properly wired the dependencies.
   *
   * This test corresponds to verifying that in the original helloHandler.js,
   * the required modules (errorHandler, logger, constants) were properly
   * imported and available for use.
   */
  it('should have HelloService injected', () => {
    // Verify the service instance exists and is properly injected
    // This confirms the DI container correctly resolved HelloService
    expect(service).toBeDefined();

    // Additional verification that service is an instance of HelloService
    expect(service).toBeInstanceOf(HelloService);
  });

  /* --------------------------------------------------------------------------
   * TEST SUITE: getHello() Method
   * --------------------------------------------------------------------------
   * Tests for the GET /hello endpoint handler method
   *
   * These tests transform the original helloHandler.test.js assertions:
   * - Lines 63-85: "should return 200 OK with 'Hello world' for GET requests"
   * - The response verification: expect(res.end).toHaveBeenCalledWith(MESSAGES.HELLO_RESPONSE)
   *
   * In NestJS, HTTP status codes and headers are handled by decorators,
   * so we focus on testing the return value and service delegation.
   * -------------------------------------------------------------------------- */
  describe('getHello', () => {
    /**
     * Test: getHello() should return 'Hello world'
     *
     * @description
     * Verifies that the getHello() method returns the correct 'Hello world'
     * message. This is the primary functional test for the /hello endpoint.
     *
     * Transforms from original helloHandler.test.js:
     * - Line 77: expect(res.end).toHaveBeenCalledWith(MESSAGES.HELLO_RESPONSE)
     * - Line 68: expect(res.statusCode).toBe(HTTP_STATUS.OK)
     *
     * In NestJS, the return value becomes the response body automatically,
     * and the @HttpCode decorator handles status code setting. We test
     * the return value rather than res.end() calls.
     */
    it("should return 'Hello world'", () => {
      // Call the controller's getHello() method
      // This replaces: handleHelloRequest(req, res) from the original tests
      const result = controller.getHello();

      // Verify the response matches the expected 'Hello world' message
      // This transforms: expect(res.end).toHaveBeenCalledWith(MESSAGES.HELLO_RESPONSE)
      expect(result).toBe('Hello world');
    });

    /**
     * Test: getHello() should call service.getHello()
     *
     * @description
     * Verifies that the controller properly delegates to the service layer.
     * This ensures the separation of concerns between HTTP handling (controller)
     * and business logic (service) is properly implemented.
     *
     * In the original helloHandler.test.js, there was no service layer,
     * so the handler contained all logic. This test verifies the NestJS
     * pattern of controller-service separation.
     */
    it('should call service.getHello()', () => {
      // Spy on the service's getHello method to track calls
      // This allows us to verify the controller delegates to the service
      const getHelloSpy = jest.spyOn(service, 'getHello');

      // Call the controller method
      controller.getHello();

      // Verify the service method was called exactly once
      // This confirms the controller delegates business logic to the service
      expect(getHelloSpy).toHaveBeenCalled();
      expect(getHelloSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Test: getHello() should return service response value
     *
     * @description
     * Verifies that the controller returns exactly what the service returns,
     * ensuring proper data flow from service through controller to response.
     *
     * This test uses a mock to verify the controller passes through the
     * service's return value without modification.
     */
    it('should return the value from service.getHello()', () => {
      // Create a mock return value for testing
      const mockResponse = 'Mocked Hello world';

      // Mock the service method to return our test value
      // This isolates the controller test from the actual service implementation
      jest.spyOn(service, 'getHello').mockReturnValue(mockResponse);

      // Call the controller method
      const result = controller.getHello();

      // Verify the controller returns exactly what the service returns
      // This confirms no data transformation occurs in the controller
      expect(result).toBe(mockResponse);
    });

    /**
     * Test: getHello() should return string type
     *
     * @description
     * Verifies the return type of the getHello() method is a string.
     * This ensures type safety and API contract compliance.
     *
     * The original API contract specifies Content-Type: text/plain,
     * so the response must be a string value.
     */
    it('should return a string type', () => {
      // Call the controller method
      const result = controller.getHello();

      // Verify the result is of string type
      // This ensures API contract compliance (Content-Type: text/plain)
      expect(typeof result).toBe('string');
    });
  });

  /* --------------------------------------------------------------------------
   * NOTE ON 405 METHOD NOT ALLOWED TESTING
   * --------------------------------------------------------------------------
   * In the original helloHandler.test.js (lines 88-107), there were tests for:
   * - "should call handle405 for non-GET requests"
   * - Testing POST, PUT, DELETE methods triggering 405 response
   *
   * In NestJS, 405 Method Not Allowed is handled automatically by the
   * framework when an HTTP method doesn't have a corresponding handler.
   * Since HelloController only has @Get() decorated method, all other
   * HTTP methods (POST, PUT, DELETE, etc.) automatically receive 405.
   *
   * This behavior is tested in e2e tests (app.e2e-spec.ts) rather than
   * unit tests, as it requires testing the full HTTP layer:
   *
   * @example E2E test for 405
   * it('should return 405 for POST /hello', () => {
   *   return request(app.getHttpServer())
   *     .post('/hello')
   *     .expect(405);
   * });
   *
   * The unit tests focus on the controller's own methods and behavior,
   * while the framework's HTTP routing behavior is tested at integration level.
   * -------------------------------------------------------------------------- */
});
