/**
 * @fileoverview Root Application Service for NestJS Hello World Application
 * @module AppService
 * @description This service provides root-level application business logic including
 *              health check functionality and application metadata retrieval. It serves
 *              as the primary service layer for the AppController and demonstrates
 *              NestJS dependency injection patterns. This service can be extended for
 *              cross-cutting concerns that affect the entire application.
 * 
 * @author Blitzy Platform
 * @created 2024
 * @version 1.0.0
 * 
 * @remarks
 * This service follows NestJS best practices:
 * - Uses @Injectable() decorator for dependency injection registration
 * - Provides clean separation of concerns from the controller layer
 * - Implements methods that can be easily unit tested
 * - Follows single responsibility principle for application-level operations
 * 
 * @example
 * ```typescript
 * // The service is automatically injected into controllers via constructor injection
 * constructor(private readonly appService: AppService) {}
 * 
 * // Then methods can be called from the controller
 * const health = this.appService.getHealth();
 * const info = this.appService.getAppInfo();
 * ```
 */

// =============================================================================
// NestJS Common Decorators
// =============================================================================
// The Injectable decorator from @nestjs/common marks this class as a provider
// that can be managed by the NestJS Inversion of Control (IoC) container.
// This enables automatic dependency injection throughout the application.
import { Injectable } from '@nestjs/common';

// =============================================================================
// Constants and Types
// =============================================================================

/**
 * Interface defining the structure of application information returned by getAppInfo()
 * @interface IAppInfo
 * @description Provides type safety for application metadata responses
 */
interface IAppInfo {
  /** The name of the application */
  name: string;
  /** The current version of the application */
  version: string;
  /** Brief description of the application's purpose */
  description: string;
  /** The runtime environment (development, production, test) */
  environment: string;
  /** ISO 8601 timestamp of when the application started */
  startTime: string;
  /** Current uptime in human-readable format */
  uptime: string;
  /** Node.js version running the application */
  nodeVersion: string;
}

/**
 * The timestamp when the application/service was instantiated.
 * Used to calculate uptime for health monitoring and debugging purposes.
 * @constant {Date}
 */
const SERVICE_START_TIME: Date = new Date();

// =============================================================================
// AppService Class Definition
// =============================================================================

/**
 * @class AppService
 * @description Root-level application service that provides core business logic
 *              for application-wide operations. This service is responsible for:
 *              - Health check status reporting for monitoring systems
 *              - Application metadata and information retrieval
 *              - Serving as a foundation for cross-cutting application concerns
 * 
 *              The service is decorated with @Injectable() to enable NestJS's
 *              dependency injection system to manage its lifecycle and provide
 *              it to dependent controllers and other services.
 * 
 * @implements {Injectable}
 * 
 * @example
 * ```typescript
 * // In a controller file
 * import { Controller, Get } from '@nestjs/common';
 * import { AppService } from './app.service';
 * 
 * @Controller()
 * export class AppController {
 *   constructor(private readonly appService: AppService) {}
 * 
 *   @Get('health')
 *   getHealth(): string {
 *     return this.appService.getHealth();
 *   }
 * }
 * ```
 * 
 * @see {@link https://docs.nestjs.com/providers} NestJS Providers Documentation
 * @since 1.0.0
 */
@Injectable()
export class AppService {
  // ===========================================================================
  // Private Properties
  // ===========================================================================

  /**
   * The timestamp when this service instance was created.
   * Used internally to calculate service uptime.
   * @private
   * @readonly
   */
  private readonly instanceStartTime: Date;

  // ===========================================================================
  // Constructor
  // ===========================================================================

  /**
   * Creates an instance of AppService.
   * @constructor
   * @description Initializes the service and records the instantiation timestamp
   *              for uptime calculations. The NestJS IoC container automatically
   *              calls this constructor when the service is first requested.
   * 
   * @remarks
   * In NestJS, services are singletons by default within a module scope.
   * This means the constructor is called only once when the service is
   * first injected, and the same instance is reused for subsequent injections.
   * 
   * @example
   * ```typescript
   * // NestJS automatically instantiates the service
   * // No manual construction is needed
   * ```
   */
  constructor() {
    // Record the exact moment this service instance was created
    // This enables accurate uptime reporting for monitoring purposes
    this.instanceStartTime = new Date();
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Returns the current health status of the application.
   * @method getHealth
   * @description Provides a simple health check response that indicates the
   *              application is running and responsive. This method is designed
   *              to be lightweight and fast, suitable for frequent polling by
   *              load balancers, container orchestrators (like Kubernetes),
   *              and monitoring systems.
   * 
   * @returns {string} A string indicating the health status of the application.
   *                   Returns 'OK' when the application is healthy and operational.
   * 
   * @remarks
   * The health check follows the convention of returning a simple 'OK' string
   * for basic health verification. For more detailed health information,
   * consider using the getAppInfo() method or implementing a dedicated
   * health module with @nestjs/terminus.
   * 
   * Common use cases:
   * - Kubernetes liveness/readiness probes
   * - AWS ELB/ALB health checks
   * - Docker HEALTHCHECK instructions
   * - Monitoring dashboards (Datadog, New Relic, etc.)
   * 
   * @example
   * ```typescript
   * const health = appService.getHealth();
   * console.log(health); // Output: 'OK'
   * ```
   * 
   * @see {@link https://docs.nestjs.com/recipes/terminus} NestJS Health Checks
   * @since 1.0.0
   */
  getHealth(): string {
    // Return a simple 'OK' status to indicate the service is healthy
    // This lightweight response ensures minimal overhead for frequent health checks
    return 'OK';
  }

  /**
   * Returns comprehensive application metadata and runtime information.
   * @method getAppInfo
   * @description Provides detailed information about the running application
   *              instance including version, environment, uptime, and runtime
   *              details. This method is useful for debugging, monitoring,
   *              and administrative interfaces.
   * 
   * @returns {IAppInfo} An object containing application metadata:
   *          - name: The application name
   *          - version: Current application version
   *          - description: Brief description of the application
   *          - environment: Current runtime environment (NODE_ENV)
   *          - startTime: ISO 8601 timestamp of application start
   *          - uptime: Human-readable uptime string
   *          - nodeVersion: Node.js version running the application
   * 
   * @remarks
   * This method provides more detailed information than getHealth() and
   * should be used when more context about the application state is needed.
   * Consider protecting this endpoint in production environments as it
   * may expose sensitive runtime information.
   * 
   * The uptime is calculated from when the service was instantiated,
   * which typically corresponds to application startup time.
   * 
   * @example
   * ```typescript
   * const info = appService.getAppInfo();
   * console.log(info);
   * // Output:
   * // {
   * //   name: 'hello-world-nestjs',
   * //   version: '1.0.0',
   * //   description: 'Hello World API built with NestJS',
   * //   environment: 'development',
   * //   startTime: '2024-01-15T10:30:00.000Z',
   * //   uptime: '2 hours, 15 minutes, 30 seconds',
   * //   nodeVersion: 'v18.17.0'
   * // }
   * ```
   * 
   * @see {@link IAppInfo} Interface definition for the return type
   * @since 1.0.0
   */
  getAppInfo(): IAppInfo {
    // Calculate the current uptime based on when the service started
    const uptime = this.calculateUptime();

    // Build and return the application information object
    // All values are computed at call time to ensure accuracy
    return {
      // Application identification
      name: 'hello-world-nestjs',
      version: '1.0.0',
      description: 'Hello World API built with NestJS',

      // Runtime environment information
      // Falls back to 'development' if NODE_ENV is not set
      environment: process.env.NODE_ENV || 'development',

      // Timing information
      // startTime uses the module-level constant for consistency
      startTime: SERVICE_START_TIME.toISOString(),
      uptime: uptime,

      // Node.js runtime version
      // Useful for debugging compatibility issues
      nodeVersion: process.version,
    };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Calculates the application uptime and formats it as a human-readable string.
   * @method calculateUptime
   * @private
   * @description Computes the elapsed time since the service was instantiated
   *              and formats it into a human-readable string showing hours,
   *              minutes, and seconds.
   * 
   * @returns {string} A formatted uptime string (e.g., "2 hours, 15 minutes, 30 seconds")
   * 
   * @remarks
   * This method uses the instance start time recorded during construction
   * to calculate the exact uptime. The calculation accounts for:
   * - Hours (no upper limit)
   * - Minutes (0-59)
   * - Seconds (0-59)
   * 
   * Days are not shown separately; they are included in the hours count.
   * 
   * @example
   * ```typescript
   * // Internal usage only
   * const uptime = this.calculateUptime();
   * // Returns: "2 hours, 15 minutes, 30 seconds"
   * ```
   */
  private calculateUptime(): string {
    // Calculate the difference in milliseconds between now and start time
    const now = new Date();
    const uptimeMs = now.getTime() - this.instanceStartTime.getTime();

    // Convert milliseconds to seconds for easier calculation
    const totalSeconds = Math.floor(uptimeMs / 1000);

    // Extract hours, minutes, and seconds from total seconds
    // Hours can exceed 24 (we don't convert to days for simplicity)
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Build the formatted uptime string with proper pluralization
    // Each unit is only included if it has a non-zero value, except seconds
    const parts: string[] = [];

    // Add hours if present
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }

    // Add minutes if present
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }

    // Always include seconds for precision, even if zero
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);

    // Join all parts with commas for readability
    return parts.join(', ');
  }
}
