/**
 * @fileoverview Unit Tests for AppController (Root Application Controller)
 * @module AppController.Tests
 * @description This test file contains comprehensive unit tests for the AppController,
 *              the root-level controller of the NestJS Hello World application. The tests
 *              verify controller instantiation, dependency injection of AppService, and
 *              the proper functioning of the health check endpoint.
 *
 *              This file was transformed from the original vanilla Node.js test file:
 *              `src/backend/__tests__/index.test.js`
 *
 *              The original file tested:
 *              - Server initialization and startup
 *              - Graceful shutdown setup
 *              - Error handling during startup
 *
 *              This NestJS version tests:
 *              - Controller instantiation via NestJS Test module
 *              - Dependency injection of AppService
 *              - Health check endpoint functionality (getHealth method)
 *
 *              Testing Patterns Used:
 *              - NestJS TestingModule for isolated controller testing
 *              - Jest matchers for assertions
 *              - beforeEach for module setup and teardown
 *              - Mock/spy patterns for service method verification
 *
 * @author Blitzy Platform
 * @created 2024
 * @version 1.0.0
 *
 * @see {@link https://docs.nestjs.com/fundamentals/testing} NestJS Testing Documentation
 * @see {@link AppController} The controller under test
 * @see {@link AppService} The service dependency being injected
 */

// =============================================================================
// NestJS Testing Utilities
// =============================================================================
// The Test class from @nestjs/testing provides utilities for creating a testing
// module that simulates the NestJS runtime environment. This enables us to test
// controllers with proper dependency injection without starting a full HTTP server.
// TestingModule is the compiled module instance returned by Test.createTestingModule().compile()
import { Test, TestingModule } from '@nestjs/testing';

// =============================================================================
// Controller Under Test
// =============================================================================
// Import the AppController class that we will be testing.
// AppController is the root-level controller that handles health check requests
// at the application root path (/).
import { AppController } from '../../src/app.controller';

// =============================================================================
// Service Dependency
// =============================================================================
// Import the AppService which is injected into AppController via constructor injection.
// We need to register this as a provider in our testing module so that NestJS
// can properly resolve the dependency when instantiating the controller.
import { AppService } from '../../src/app.service';

// =============================================================================
// Test Suite: AppController
// =============================================================================

/**
 * @description Test suite for AppController unit tests.
 *              Tests cover controller instantiation, dependency injection,
 *              and the health check endpoint functionality.
 *
 * @remarks
 * The test suite follows the Arrange-Act-Assert (AAA) pattern:
 * - Arrange: Set up the testing module and get controller/service instances
 * - Act: Call the method under test
 * - Assert: Verify the expected behavior using Jest matchers
 *
 * Each test runs in isolation with a fresh TestingModule instance
 * created in the beforeEach hook.
 */
describe('AppController', () => {
  // ===========================================================================
  // Test Variables
  // ===========================================================================

  /**
   * Reference to the AppController instance under test.
   * This is retrieved from the compiled TestingModule in beforeEach.
   * @type {AppController}
   */
  let appController: AppController;

  /**
   * Reference to the AppService instance injected into the controller.
   * This allows us to spy on service methods and verify controller-service interactions.
   * @type {AppService}
   */
  let appService: AppService;

  /**
   * Reference to the compiled NestJS TestingModule.
   * Used to retrieve instances of providers registered in the module.
   * @type {TestingModule}
   */
  let module: TestingModule;

  // ===========================================================================
  // Test Setup (beforeEach)
  // ===========================================================================

  /**
   * @description Sets up a fresh NestJS TestingModule before each test.
   *              This ensures test isolation and prevents state leakage between tests.
   *
   * @remarks
   * The Test.createTestingModule() method creates a module definition similar to
   * how @Module() decorator works in regular NestJS applications. We register:
   * - controllers: Array of controller classes to be instantiated
   * - providers: Array of service classes for dependency injection
   *
   * After calling .compile(), NestJS resolves all dependencies and creates
   * instances that can be retrieved using module.get<Type>(Type).
   *
   * This pattern is the recommended approach for unit testing NestJS controllers
   * as described in the official NestJS documentation.
   *
   * @see {@link https://docs.nestjs.com/fundamentals/testing#unit-testing} NestJS Unit Testing
   */
  beforeEach(async () => {
    // Create a testing module that mirrors the actual AppModule structure
    // but in an isolated test environment. This allows us to test the
    // controller without starting a full HTTP server.
    module = await Test.createTestingModule({
      // Register the controller(s) to be tested
      // NestJS will instantiate these and inject their dependencies
      controllers: [AppController],

      // Register the service providers required by the controller(s)
      // AppService is injected into AppController via constructor injection
      providers: [AppService],
    }).compile();
    // The .compile() method creates the module instance and resolves all
    // dependencies. After this, we can retrieve any registered provider
    // or controller from the module.

    // Retrieve the controller instance from the compiled module
    // This is the actual AppController instance that NestJS created
    // with AppService properly injected via constructor injection
    appController = module.get<AppController>(AppController);

    // Retrieve the service instance that was injected into the controller
    // This allows us to verify the service was properly injected and
    // to spy on its methods for testing controller behavior
    appService = module.get<AppService>(AppService);
  });

  // ===========================================================================
  // Test Cleanup (afterEach)
  // ===========================================================================

  /**
   * @description Cleans up the testing module after each test to prevent memory leaks
   *              and ensure proper resource cleanup.
   *
   * @remarks
   * Closing the module is important for:
   * - Releasing any resources held by providers
   * - Ensuring connection pools are properly closed
   * - Preventing memory leaks in long test runs
   */
  afterEach(async () => {
    // Close the testing module to clean up resources
    // This is especially important if providers have onModuleDestroy hooks
    if (module) {
      await module.close();
    }
  });

  // ===========================================================================
  // Test Cases: Controller Instantiation
  // ===========================================================================

  /**
   * @description Verifies that the AppController is properly instantiated
   *              by the NestJS testing module.
   *
   * @remarks
   * This is a fundamental test that ensures the testing module is configured
   * correctly and can create an instance of the controller. If this test fails,
   * it typically indicates a problem with:
   * - Missing imports in the testing module
   * - Missing providers (dependencies)
   * - Circular dependency issues
   *
   * The toBeDefined() matcher ensures the controller variable is not undefined,
   * confirming that module.get<AppController>() successfully retrieved an instance.
   */
  it('should be defined', () => {
    // Assert that the controller instance exists and is not undefined
    // This verifies that NestJS successfully created the controller
    expect(appController).toBeDefined();
  });

  /**
   * @description Verifies that AppService is properly injected into AppController
   *              through NestJS's dependency injection system.
   *
   * @remarks
   * This test confirms that:
   * 1. AppService is registered as a provider in the testing module
   * 2. NestJS's DI system correctly resolves the AppService dependency
   * 3. The service instance is available for use in the controller
   *
   * Dependency injection is a core pattern in NestJS, and verifying it works
   * correctly is essential for ensuring the controller can perform its duties.
   */
  it('should have AppService injected', () => {
    // Verify that the service instance is defined
    // This confirms dependency injection is working correctly
    expect(appService).toBeDefined();

    // Verify that the service is an instance of AppService
    // This ensures the correct type was injected
    expect(appService).toBeInstanceOf(AppService);
  });

  // ===========================================================================
  // Test Cases: Health Check Endpoint (getHealth)
  // ===========================================================================

  /**
   * @description Test suite for the getHealth() method of AppController.
   *              This method handles GET requests to the root path (/) and
   *              returns the application health status.
   */
  describe('getHealth', () => {
    /**
     * @description Verifies that the getHealth() method returns the expected
     *              health status string 'OK'.
     *
     * @remarks
     * The health check endpoint is critical for:
     * - Kubernetes liveness/readiness probes
     * - AWS ELB/ALB health checks
     * - Docker HEALTHCHECK instructions
     * - Monitoring and alerting systems
     *
     * The expected response is 'OK' which indicates the application is
     * healthy and ready to receive traffic.
     */
    it('should return health status "OK"', () => {
      // Act: Call the getHealth method on the controller
      const result = appController.getHealth();

      // Assert: Verify the method returns the expected health status
      // The health check should return 'OK' to indicate a healthy application
      expect(result).toBe('OK');
    });

    /**
     * @description Verifies that getHealth() delegates to AppService.getHealth()
     *              following the NestJS pattern of controllers delegating to services.
     *
     * @remarks
     * This test uses Jest's spyOn to verify that the controller properly
     * delegates the health check logic to the service layer. This pattern
     * ensures:
     * - Controllers remain thin and focused on HTTP handling
     * - Business logic is encapsulated in services
     * - Services can be easily mocked for testing
     *
     * The spyOn approach allows us to verify the method was called
     * while still using the real implementation.
     */
    it('should delegate to AppService.getHealth()', () => {
      // Arrange: Create a spy on the AppService.getHealth method
      // This allows us to verify the method is called without changing its behavior
      const getHealthSpy = jest.spyOn(appService, 'getHealth');

      // Act: Call the controller's getHealth method
      appController.getHealth();

      // Assert: Verify that the service's getHealth method was called
      // This confirms the controller delegates to the service as expected
      expect(getHealthSpy).toHaveBeenCalled();
      expect(getHealthSpy).toHaveBeenCalledTimes(1);

      // Clean up the spy to prevent interference with other tests
      getHealthSpy.mockRestore();
    });

    /**
     * @description Verifies that getHealth() returns the value from AppService.getHealth().
     *
     * @remarks
     * This test mocks the AppService.getHealth() method to return a custom value
     * and verifies that the controller returns whatever the service returns.
     * This ensures the controller is simply passing through the service response
     * without modification.
     */
    it('should return the value from AppService.getHealth()', () => {
      // Arrange: Mock the service method to return a custom value
      const mockHealthStatus = 'HEALTHY';
      jest.spyOn(appService, 'getHealth').mockReturnValue(mockHealthStatus);

      // Act: Call the controller's getHealth method
      const result = appController.getHealth();

      // Assert: Verify the controller returns the mocked service value
      expect(result).toBe(mockHealthStatus);
    });

    /**
     * @description Verifies that getHealth() returns a string type.
     *
     * @remarks
     * Type checking in tests helps ensure the API contract is maintained.
     * The health endpoint should always return a string response that can
     * be easily consumed by health monitoring systems.
     */
    it('should return a string type', () => {
      // Act: Call the getHealth method
      const result = appController.getHealth();

      // Assert: Verify the result is a string
      expect(typeof result).toBe('string');
    });
  });

  // ===========================================================================
  // Test Cases: Controller Structure
  // ===========================================================================

  /**
   * @description Test suite for verifying the structural properties of AppController.
   *              These tests ensure the controller is properly configured as a NestJS
   *              controller with the expected methods.
   */
  describe('Controller Structure', () => {
    /**
     * @description Verifies that the AppController has the getHealth method.
     *
     * @remarks
     * This test ensures the controller has the expected interface.
     * It's useful for catching accidental method removals or renames.
     */
    it('should have getHealth method', () => {
      // Assert that the getHealth method exists on the controller
      expect(appController.getHealth).toBeDefined();
      expect(typeof appController.getHealth).toBe('function');
    });

    /**
     * @description Verifies that AppController is an instance of the AppController class.
     *
     * @remarks
     * This confirms that the testing module created an actual instance of
     * the AppController class rather than some mock or proxy object.
     */
    it('should be an instance of AppController', () => {
      // Assert the controller is an instance of the AppController class
      expect(appController).toBeInstanceOf(AppController);
    });
  });

  // ===========================================================================
  // Test Cases: Error Scenarios
  // ===========================================================================

  /**
   * @description Test suite for error handling scenarios in AppController.
   *              These tests verify the controller behaves correctly when
   *              the underlying service encounters errors.
   */
  describe('Error Handling', () => {
    /**
     * @description Verifies that errors from AppService.getHealth() propagate correctly.
     *
     * @remarks
     * When the service throws an error, the controller should allow it to propagate
     * so that NestJS's exception filters can handle it appropriately.
     * This test ensures the controller doesn't swallow exceptions.
     */
    it('should propagate errors from AppService.getHealth()', () => {
      // Arrange: Mock the service to throw an error
      const testError = new Error('Service unavailable');
      jest.spyOn(appService, 'getHealth').mockImplementation(() => {
        throw testError;
      });

      // Act & Assert: Verify the error is propagated
      expect(() => appController.getHealth()).toThrow(testError);
      expect(() => appController.getHealth()).toThrow('Service unavailable');
    });
  });
});
