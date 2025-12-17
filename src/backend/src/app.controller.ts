/**
 * @fileoverview Root Application Controller for NestJS Hello World Application
 * @module AppController
 * @description This controller serves as the root-level HTTP request handler for the
 *              NestJS Hello World application. It provides essential application-wide
 *              endpoints, primarily the health check endpoint used by container
 *              orchestration systems (Kubernetes, Docker Swarm), load balancers
 *              (AWS ALB/ELB, nginx), and monitoring systems (Datadog, New Relic)
 *              to verify application availability and responsiveness.
 *
 *              The controller follows NestJS best practices:
 *              - Uses @Controller() decorator with no route prefix (handles root path)
 *              - Implements dependency injection for AppService
 *              - Delegates business logic to service layer
 *              - Provides clean separation between HTTP handling and business logic
 *
 * @author Blitzy Platform
 * @created 2024
 * @version 1.0.0
 *
 * @remarks
 * This controller is part of the AppModule and is automatically discovered by NestJS
 * through the module's controllers array. It demonstrates the fundamental NestJS
 * pattern of Controller -> Service dependency, where:
 * - Controllers handle HTTP request/response orchestration
 * - Services contain the actual business logic
 *
 * The health check endpoint at the root path (/) is intentionally lightweight
 * to minimize resource consumption during frequent polling by infrastructure
 * monitoring systems.
 *
 * @example
 * ```typescript
 * // The controller is automatically instantiated by NestJS
 * // and the AppService is injected via constructor injection
 *
 * // Accessing the health endpoint:
 * // GET http://localhost:3000/
 * // Response: "OK" (200 OK)
 * ```
 *
 * @see {@link https://docs.nestjs.com/controllers} NestJS Controllers Documentation
 * @see {@link AppService} The service providing business logic for this controller
 */

// =============================================================================
// NestJS Common Decorators
// =============================================================================
// Import essential NestJS decorators from the common package:
// - Controller: Class decorator that marks a class as a NestJS controller
//              capable of handling incoming HTTP requests
// - Get: Method decorator that creates a route handler for HTTP GET requests
//        When applied without arguments, it handles GET requests to the base path
import { Controller, Get } from '@nestjs/common';

// =============================================================================
// Application Service
// =============================================================================
// Import the root application service that contains the business logic
// for health checks and application information. This follows the NestJS
// pattern of separating HTTP handling (controllers) from business logic (services).
import { AppService } from './app.service';

// =============================================================================
// AppController Class Definition
// =============================================================================

/**
 * @class AppController
 * @description Root-level controller for the NestJS Hello World application that
 *              handles HTTP requests at the application root path. This controller
 *              is responsible for:
 *
 *              1. **Health Check Endpoint**: Provides a lightweight GET endpoint
 *                 at the root path (/) that returns the application health status.
 *                 This is essential for:
 *                 - Kubernetes liveness/readiness probes
 *                 - AWS ELB/ALB target group health checks
 *                 - Docker HEALTHCHECK instructions
 *                 - Monitoring and alerting systems
 *
 *              2. **Dependency Injection Demonstration**: Shows proper NestJS DI
 *                 patterns by injecting AppService via constructor injection.
 *
 *              The @Controller() decorator without a path argument means this
 *              controller handles requests at the root level (i.e., '/').
 *
 * @decorator @Controller
 * @param {string} [path] - Optional route path prefix. When omitted (as here),
 *                          the controller handles the root path '/'.
 *
 * @example
 * ```typescript
 * // Making a health check request
 * // Request: GET /
 * // Response: 200 OK with body "OK"
 *
 * // Using curl:
 * // curl -X GET http://localhost:3000/
 * // Output: OK
 *
 * // Using fetch in JavaScript:
 * // const response = await fetch('http://localhost:3000/');
 * // const health = await response.text(); // "OK"
 * ```
 *
 * @see {@link https://docs.nestjs.com/controllers} NestJS Controllers Documentation
 * @see {@link AppService} Service providing the health check logic
 * @since 1.0.0
 */
// The @Controller() decorator marks this class as a NestJS controller.
// When no path is provided, the controller handles the root path (/).
// This is ideal for application-wide endpoints like health checks.
@Controller()
export class AppController {
  // ===========================================================================
  // Private Properties
  // ===========================================================================

  /**
   * Reference to the injected AppService instance.
   * This service contains the business logic for health checks and
   * application information retrieval.
   *
   * @private
   * @readonly
   * @type {AppService}
   */
  // The 'private readonly' keywords ensure:
  // - private: The service is only accessible within this class
  // - readonly: The service reference cannot be reassigned after construction

  // ===========================================================================
  // Constructor
  // ===========================================================================

  /**
   * Creates an instance of AppController with injected dependencies.
   * @constructor
   * @description Initializes the controller with the required AppService dependency.
   *              NestJS's dependency injection system automatically resolves and
   *              injects the AppService instance when the controller is instantiated.
   *
   * @param {AppService} appService - The injected application service instance
   *                                  providing health check and app info functionality.
   *                                  NestJS automatically injects this based on the
   *                                  type annotation.
   *
   * @remarks
   * Constructor injection is the preferred method of dependency injection in NestJS
   * because it:
   * - Makes dependencies explicit and visible
   * - Enables easier unit testing through mock injection
   * - Ensures dependencies are available when the class is instantiated
   * - Follows the dependency inversion principle (SOLID)
   *
   * The `private readonly` modifier in TypeScript automatically creates and assigns
   * a class property, eliminating the need for explicit property declaration and
   * assignment in the constructor body.
   *
   * @example
   * ```typescript
   * // NestJS automatically instantiates the controller with dependencies
   * // No manual construction is needed
   *
   * // For testing, you can manually construct with a mock:
   * const mockAppService = { getHealth: jest.fn().mockReturnValue('OK') };
   * const controller = new AppController(mockAppService as any);
   * ```
   *
   * @see {@link https://docs.nestjs.com/providers#dependency-injection} NestJS DI Docs
   */
  constructor(private readonly appService: AppService) {
    // The appService is automatically assigned to this.appService
    // by TypeScript's parameter property syntax (private readonly)
    // No additional initialization logic is needed here
  }

  // ===========================================================================
  // Public Route Handlers
  // ===========================================================================

  /**
   * Handles GET requests to the root path (/) and returns application health status.
   * @method getHealth
   * @description This endpoint provides a simple health check mechanism for the
   *              application. It returns a string indicating the application's
   *              operational status, which is used by various infrastructure
   *              components to determine if the application is healthy and ready
   *              to receive traffic.
   *
   * @returns {string} The health status string returned by AppService.getHealth().
   *                   Returns 'OK' when the application is healthy and operational.
   *
   * @remarks
   * **Endpoint Details:**
   * - HTTP Method: GET
   * - Path: / (root)
   * - Response Status: 200 OK (on success)
   * - Response Body: Plain text string "OK"
   * - Content-Type: text/html; charset=utf-8 (NestJS default for strings)
   *
   * **Use Cases:**
   * - **Kubernetes Probes**: Configure as liveness and/or readiness probe
   *   ```yaml
   *   livenessProbe:
   *     httpGet:
   *       path: /
   *       port: 3000
   *     initialDelaySeconds: 5
   *     periodSeconds: 10
   *   ```
   *
   * - **AWS Load Balancer**: Configure as target group health check
   *   - Protocol: HTTP
   *   - Path: /
   *   - Port: traffic-port
   *   - Healthy threshold: 2
   *   - Unhealthy threshold: 3
   *
   * - **Docker HEALTHCHECK**:
   *   ```dockerfile
   *   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   *     CMD curl -f http://localhost:3000/ || exit 1
   *   ```
   *
   * **Performance Characteristics:**
   * - Lightweight operation with minimal resource consumption
   * - No database calls or external dependencies
   * - Suitable for high-frequency polling (every few seconds)
   * - Typical response time: < 5ms
   *
   * @example
   * ```typescript
   * // Example HTTP request/response
   *
   * // Request:
   * // GET / HTTP/1.1
   * // Host: localhost:3000
   *
   * // Response:
   * // HTTP/1.1 200 OK
   * // Content-Type: text/html; charset=utf-8
   * // Content-Length: 2
   * //
   * // OK
   * ```
   *
   * @decorator @Get
   * @param {string} [path] - Optional path suffix. When omitted, handles the
   *                          controller's base path (/).
   *
   * @see {@link AppService#getHealth} The service method that provides the health status
   * @see {@link https://docs.nestjs.com/controllers#routing} NestJS Routing Documentation
   * @since 1.0.0
   */
  // The @Get() decorator creates a route handler for HTTP GET requests.
  // Without a path argument, it handles GET requests to the controller's base path.
  // Since the controller has no prefix, this handles GET /
  @Get()
  getHealth(): string {
    // Delegate to the AppService for the actual health check logic.
    // This follows the NestJS pattern of keeping controllers thin
    // and putting business logic in services.
    //
    // The service's getHealth() method returns 'OK' to indicate
    // the application is healthy and operational.
    return this.appService.getHealth();
  }
}
