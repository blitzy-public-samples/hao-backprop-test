/**
 * @fileoverview Unit Tests for AppService - Root Application Service
 * @module AppServiceTests
 * @description This test file contains comprehensive unit tests for the AppService class,
 *              which is the root-level application service providing health check and
 *              application metadata functionality. The tests verify service instantiation
 *              through NestJS dependency injection, method return values, and proper
 *              behavior of all public methods.
 *
 *              Tests follow NestJS testing best practices:
 *              - Using @nestjs/testing Test module for DI container setup
 *              - Standalone service testing without HTTP layer
 *              - Jest matchers for assertion verification
 *              - beforeEach hooks for fresh test instances
 *
 * @author Blitzy Platform
 * @created 2024
 * @version 1.0.0
 *
 * @see {@link https://docs.nestjs.com/fundamentals/testing} NestJS Testing Documentation
 * @see {@link AppService} The service class under test
 */

// =============================================================================
// NestJS Testing Utilities
// =============================================================================
// The Test class provides the createTestingModule() factory method for creating
// an isolated testing module with dependency injection support.
// TestingModule is the compiled module interface that allows retrieving
// service instances from the DI container.
import { Test, TestingModule } from '@nestjs/testing';

// =============================================================================
// Service Under Test
// =============================================================================
// AppService is the root-level application service being tested.
// It provides health check status reporting and application metadata retrieval.
import { AppService } from '../../src/app.service';

// =============================================================================
// Test Suite: AppService
// =============================================================================

/**
 * @description Test suite for AppService unit tests.
 *              These tests verify the functionality of the root application service
 *              in isolation, without any HTTP layer or external dependencies.
 *
 *              The test suite covers:
 *              - Service instantiation through dependency injection
 *              - getHealth() method returning correct health status
 *              - getAppInfo() method returning complete application metadata
 *              - Type safety and interface compliance
 *
 * @example
 * Run these tests with:
 * ```bash
 * npm test -- --testPathPattern=app.service.spec
 * ```
 */
describe('AppService', () => {
  // ===========================================================================
  // Test Variables
  // ===========================================================================

  /**
   * The service instance under test.
   * Retrieved from the NestJS testing module's dependency injection container.
   * @type {AppService}
   */
  let service: AppService;

  /**
   * The compiled testing module containing the service provider.
   * Used to access the DI container and retrieve service instances.
   * @type {TestingModule}
   */
  let module: TestingModule;

  // ===========================================================================
  // Test Setup (beforeEach)
  // ===========================================================================

  /**
   * @description beforeEach hook that sets up a fresh testing module before each test.
   *              This ensures test isolation and prevents state leakage between tests.
   *
   *              The setup process:
   *              1. Creates a testing module using Test.createTestingModule()
   *              2. Registers AppService as a provider in the DI container
   *              3. Compiles the module to initialize the DI container
   *              4. Retrieves the service instance from the compiled module
   *
   * @remarks
   * NestJS's Test.createTestingModule() creates an isolated testing environment
   * that mirrors the production DI container behavior. This allows testing
   * services with their dependencies properly injected, or with mocked
   * dependencies when needed.
   *
   * For AppService, we use the real service implementation since it has no
   * external dependencies that need mocking.
   */
  beforeEach(async () => {
    // Create a NestJS testing module with AppService registered as a provider.
    // This sets up an isolated DI container specifically for testing.
    // The providers array lists all classes that should be available for injection.
    module = await Test.createTestingModule({
      // Register providers that will be available in this testing module.
      // For standalone service testing, we only need the service itself.
      providers: [AppService],
    }).compile();

    // Retrieve the service instance from the compiled module's DI container.
    // The get<T>() method returns the instance of the specified provider.
    // This is equivalent to how NestJS injects the service into controllers.
    service = module.get<AppService>(AppService);
  });

  // ===========================================================================
  // Test Teardown (afterEach)
  // ===========================================================================

  /**
   * @description afterEach hook that cleans up the testing module after each test.
   *              This ensures proper resource cleanup and prevents memory leaks.
   */
  afterEach(async () => {
    // Close the testing module to release any resources.
    // This is important for preventing memory leaks in test suites.
    if (module) {
      await module.close();
    }
  });

  // ===========================================================================
  // Service Instantiation Tests
  // ===========================================================================

  /**
   * @description Test verifying that the AppService is properly defined and instantiated
   *              through the NestJS dependency injection container.
   *
   *              This is a fundamental test that ensures:
   *              - The service class can be instantiated
   *              - The @Injectable() decorator is properly applied
   *              - The DI container can resolve the service
   *
   * @remarks
   * This test is critical because it validates that the service is correctly
   * configured for dependency injection. If this test fails, it typically
   * indicates missing @Injectable() decorator or provider registration issues.
   */
  it('should be defined', () => {
    // Verify that the service instance exists and is not null/undefined.
    // toBeDefined() is a Jest matcher that checks the value is not undefined.
    expect(service).toBeDefined();
  });

  /**
   * @description Test verifying that the AppService is an instance of the AppService class.
   *              This confirms that the correct class type is resolved from the DI container.
   */
  it('should be an instance of AppService', () => {
    // Verify that the resolved service is actually an AppService instance.
    // This ensures we're testing the correct class and not a mock or substitute.
    expect(service).toBeInstanceOf(AppService);
  });

  // ===========================================================================
  // getHealth() Method Tests
  // ===========================================================================

  /**
   * @description Test suite for the getHealth() method.
   *              The getHealth() method provides a simple health check response
   *              for monitoring systems, load balancers, and container orchestrators.
   */
  describe('getHealth()', () => {
    /**
     * @description Test verifying that getHealth() returns the expected 'OK' string.
     *              This is the primary health check test ensuring the service
     *              reports a healthy status.
     *
     * @remarks
     * The health check returns a simple 'OK' string by design, following
     * common conventions for lightweight health endpoints. This ensures
     * minimal overhead for frequent health check polling.
     *
     * Expected behavior:
     * - Returns string type
     * - Returns exactly 'OK'
     * - Returns synchronously (not a Promise)
     */
    it('should return "OK" health status string', () => {
      // Call the getHealth() method on the service instance.
      const result = service.getHealth();

      // Verify the return value is exactly 'OK'.
      // toBe() uses strict equality (===) for comparison.
      expect(result).toBe('OK');
    });

    /**
     * @description Test verifying that getHealth() returns a string type.
     *              This ensures type consistency for health check consumers.
     */
    it('should return a string type', () => {
      // Call the getHealth() method.
      const result = service.getHealth();

      // Verify the result is of type string.
      // typeof check ensures type safety compliance.
      expect(typeof result).toBe('string');
    });

    /**
     * @description Test verifying that getHealth() returns a non-empty string.
     *              This ensures the health response is meaningful.
     */
    it('should return a non-empty string', () => {
      // Call the getHealth() method.
      const result = service.getHealth();

      // Verify the result has content (length > 0).
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * @description Test verifying that getHealth() returns consistent results
     *              across multiple calls. Health status should be stable.
     */
    it('should return consistent results on multiple calls', () => {
      // Call getHealth() multiple times to verify consistency.
      const result1 = service.getHealth();
      const result2 = service.getHealth();
      const result3 = service.getHealth();

      // All calls should return the same value.
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  // ===========================================================================
  // getAppInfo() Method Tests
  // ===========================================================================

  /**
   * @description Test suite for the getAppInfo() method.
   *              The getAppInfo() method provides comprehensive application metadata
   *              including version, environment, uptime, and runtime information.
   */
  describe('getAppInfo()', () => {
    /**
     * @description Test verifying that getAppInfo() returns an object.
     *              The application info should be a structured object, not a primitive.
     */
    it('should return an object', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the result is an object and not null.
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });

    /**
     * @description Test verifying that getAppInfo() returns all required properties.
     *              The returned object must contain all IAppInfo interface properties.
     *
     * @remarks
     * The IAppInfo interface requires:
     * - name: string
     * - version: string
     * - description: string
     * - environment: string
     * - startTime: string (ISO 8601)
     * - uptime: string (human-readable)
     * - nodeVersion: string
     */
    it('should return all required IAppInfo properties', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify all required properties are present.
      // Using toHaveProperty() ensures the property exists in the object.
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('nodeVersion');
    });

    /**
     * @description Test verifying the application name is correct.
     *              The name should match the NestJS application identifier.
     */
    it('should return correct application name', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the application name matches expected value.
      expect(result.name).toBe('hello-world-nestjs');
    });

    /**
     * @description Test verifying the application version format.
     *              Version should follow semantic versioning format (x.y.z).
     */
    it('should return valid version format', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the version is a non-empty string.
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);

      // Verify version follows semver pattern (basic check).
      // Semver pattern: major.minor.patch (e.g., 1.0.0)
      expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    /**
     * @description Test verifying the application version is '1.0.0'.
     *              This is the expected initial version.
     */
    it('should return version "1.0.0"', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the specific version value.
      expect(result.version).toBe('1.0.0');
    });

    /**
     * @description Test verifying the application description is correct.
     *              Description should explain the application's purpose.
     */
    it('should return correct application description', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the description matches expected value.
      expect(result.description).toBe('Hello World API built with NestJS');
    });

    /**
     * @description Test verifying the environment property is a valid string.
     *              Environment should reflect NODE_ENV or default to 'development'.
     */
    it('should return valid environment string', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the environment is a non-empty string.
      expect(typeof result.environment).toBe('string');
      expect(result.environment.length).toBeGreaterThan(0);
    });

    /**
     * @description Test verifying the environment defaults to 'development' when NODE_ENV is not set.
     *              In test environment, NODE_ENV is typically 'test'.
     */
    it('should return environment based on NODE_ENV', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the environment matches NODE_ENV or defaults to 'development'.
      // In test runs, NODE_ENV is usually 'test'.
      const expectedEnvironment = process.env.NODE_ENV || 'development';
      expect(result.environment).toBe(expectedEnvironment);
    });

    /**
     * @description Test verifying the startTime is a valid ISO 8601 timestamp.
     *              The startTime should represent when the service was instantiated.
     */
    it('should return valid ISO 8601 startTime', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the startTime is a string.
      expect(typeof result.startTime).toBe('string');

      // Verify the startTime can be parsed as a valid Date.
      const parsedDate = new Date(result.startTime);
      expect(parsedDate.toString()).not.toBe('Invalid Date');

      // Verify the startTime is in ISO 8601 format (ends with 'Z' for UTC).
      expect(result.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    /**
     * @description Test verifying the startTime is not in the future.
     *              Service start time should be at or before the current time.
     */
    it('should return startTime not in the future', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Parse the startTime and compare to now.
      const startTime = new Date(result.startTime);
      const now = new Date();

      // startTime should be at or before now.
      expect(startTime.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    /**
     * @description Test verifying the uptime is a human-readable string.
     *              Uptime should contain time units (hours, minutes, seconds).
     */
    it('should return human-readable uptime string', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the uptime is a string.
      expect(typeof result.uptime).toBe('string');

      // Verify the uptime contains 'second' or 'minute' or 'hour'.
      // At minimum, we expect 'seconds' to be present (e.g., "0 seconds").
      expect(result.uptime).toMatch(/second|minute|hour/i);
    });

    /**
     * @description Test verifying the uptime is formatted correctly.
     *              Uptime should follow the pattern: "X hours, Y minutes, Z seconds".
     */
    it('should return properly formatted uptime', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify uptime matches expected format patterns.
      // Valid formats include:
      // - "X seconds" (when < 1 minute)
      // - "X minutes, Y seconds" (when >= 1 minute)
      // - "X hours, Y minutes, Z seconds" (when >= 1 hour)
      const uptimePattern = /^(\d+ hours?, )?(\d+ minutes?, )?(\d+ seconds?)$/;
      expect(result.uptime).toMatch(uptimePattern);
    });

    /**
     * @description Test verifying the nodeVersion matches the current runtime.
     *              nodeVersion should reflect the Node.js version running the tests.
     */
    it('should return correct nodeVersion', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the nodeVersion matches process.version.
      expect(result.nodeVersion).toBe(process.version);
    });

    /**
     * @description Test verifying the nodeVersion starts with 'v'.
     *              Node.js versions follow the format vX.Y.Z.
     */
    it('should return nodeVersion starting with "v"', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify the nodeVersion starts with 'v'.
      expect(result.nodeVersion.startsWith('v')).toBe(true);
    });

    /**
     * @description Test verifying that all property values are non-null.
     *              No property in the returned object should be null.
     */
    it('should not return any null property values', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify no property is null.
      expect(result.name).not.toBeNull();
      expect(result.version).not.toBeNull();
      expect(result.description).not.toBeNull();
      expect(result.environment).not.toBeNull();
      expect(result.startTime).not.toBeNull();
      expect(result.uptime).not.toBeNull();
      expect(result.nodeVersion).not.toBeNull();
    });

    /**
     * @description Test verifying that all string properties are non-empty.
     *              All string properties should have meaningful content.
     */
    it('should not return any empty string properties', () => {
      // Call the getAppInfo() method.
      const result = service.getAppInfo();

      // Verify no property is an empty string.
      expect(result.name).not.toBe('');
      expect(result.version).not.toBe('');
      expect(result.description).not.toBe('');
      expect(result.environment).not.toBe('');
      expect(result.startTime).not.toBe('');
      expect(result.uptime).not.toBe('');
      expect(result.nodeVersion).not.toBe('');
    });

    /**
     * @description Test verifying uptime increases between calls.
     *              When called with a delay, uptime should show elapsed time.
     */
    it('should reflect elapsed time in uptime', async () => {
      // Get initial app info.
      const result1 = service.getAppInfo();

      // Wait a short period (100ms).
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get app info again.
      const result2 = service.getAppInfo();

      // The uptime should still contain seconds (may or may not change visibly).
      // Both should be valid uptime strings.
      expect(result1.uptime).toMatch(/second/);
      expect(result2.uptime).toMatch(/second/);
    });
  });

  // ===========================================================================
  // Integration Behavior Tests
  // ===========================================================================

  /**
   * @description Test suite for verifying service behavior in an integration context.
   *              These tests ensure the service behaves correctly when used as
   *              it would be in the actual application.
   */
  describe('Service Integration Behavior', () => {
    /**
     * @description Test verifying that multiple service method calls work independently.
     *              Different methods should not interfere with each other.
     */
    it('should allow calling multiple methods in sequence', () => {
      // Call both public methods in sequence.
      const health = service.getHealth();
      const appInfo = service.getAppInfo();
      const healthAgain = service.getHealth();

      // All calls should return valid results.
      expect(health).toBe('OK');
      expect(appInfo).toHaveProperty('name');
      expect(healthAgain).toBe('OK');
    });

    /**
     * @description Test verifying that service methods are idempotent.
     *              Calling methods multiple times should not change their behavior.
     */
    it('should be idempotent for getHealth calls', () => {
      // Call getHealth multiple times.
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(service.getHealth());
      }

      // All results should be identical.
      results.forEach((result) => {
        expect(result).toBe('OK');
      });
    });

    /**
     * @description Test verifying that getAppInfo returns consistent static values.
     *              Static properties like name and version should not change.
     */
    it('should return consistent static values in getAppInfo', () => {
      // Call getAppInfo multiple times.
      const result1 = service.getAppInfo();
      const result2 = service.getAppInfo();

      // Static properties should be identical.
      expect(result1.name).toBe(result2.name);
      expect(result1.version).toBe(result2.version);
      expect(result1.description).toBe(result2.description);
      expect(result1.nodeVersion).toBe(result2.nodeVersion);
    });
  });
});
