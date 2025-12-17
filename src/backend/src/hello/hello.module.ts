/**
 * @fileoverview Hello feature module for NestJS application
 *
 * This module encapsulates all functionality related to the /hello endpoint,
 * transforming the vanilla Node.js handlers/helloHandler.js module exports
 * into a proper NestJS modular architecture with dependency injection.
 *
 * @module HelloModule
 *
 * @description
 * The HelloModule is a feature module that contains:
 *
 * - HelloController: HTTP request handling for /hello endpoint
 * - HelloService: Business logic for generating Hello world responses
 *
 * This module implements NestJS's modular architecture pattern, which
 * provides several benefits over the original vanilla Node.js approach:
 *
 * - Encapsulation: All /hello related code is contained in one module
 * - Dependency injection: Services are automatically instantiated
 * - Testability: Easy to test in isolation with mock dependencies
 * - Maintainability: Clear separation of concerns
 *
 * The module transforms the CommonJS module.exports pattern from
 * handlers/helloHandler.js into NestJS's @Module() decorator pattern.
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/modules NestJS Modules}
 * @see {@link https://docs.nestjs.com/modules#feature-modules NestJS Feature Modules}
 *
 * @example
 * // Import HelloModule in AppModule
 * import { HelloModule } from './hello/hello.module';
 *
 * @Module({
 *   imports: [HelloModule],
 * })
 * export class AppModule {}
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, local components
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// Core module decorator for defining NestJS modules
import { Module } from '@nestjs/common';

// -----------------------------------------------------------------------------
// Local Component Imports
// -----------------------------------------------------------------------------
// Feature-specific controller and service
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';

/* ============================================================================
 * HELLO MODULE CLASS
 * ============================================================================
 * Feature module encapsulating /hello endpoint functionality
 * ============================================================================ */

/**
 * Feature module encapsulating all /hello endpoint functionality
 *
 * @class HelloModule
 *
 * @description
 * This module bundles together the HelloController and HelloService,
 * creating a self-contained feature unit that can be imported into
 * the root AppModule.
 *
 * The @Module() decorator configuration:
 *
 * - controllers: [HelloController]
 *   Registers HelloController with NestJS routing system.
 *   This enables the /hello route defined in the controller.
 *
 * - providers: [HelloService]
 *   Registers HelloService with NestJS dependency injection container.
 *   This allows HelloService to be injected into HelloController.
 *
 * - exports: [HelloService]
 *   Makes HelloService available to other modules that import HelloModule.
 *   This is optional but useful if other modules need hello functionality.
 *
 * Original vanilla Node.js transformation:
 * - handlers/helloHandler.js exports → Split into HelloController + HelloService
 * - module.exports = handleHelloRequest → @Module() decorator pattern
 * - require() imports → NestJS dependency injection
 *
 * Module initialization order:
 * 1. HelloService is instantiated by NestJS IoC container
 * 2. HelloController is instantiated with HelloService injected
 * 3. Routes are registered with the HTTP server
 *
 * @example
 * // The module is used by importing it in AppModule:
 * @Module({
 *   imports: [HelloModule],
 * })
 * export class AppModule {}
 *
 * @example
 * // For testing, you can create a testing module:
 * const module = await Test.createTestingModule({
 *   imports: [HelloModule],
 * }).compile();
 */
@Module({
  // ---------------------------------------------------------------------------
  // Controllers Registration
  // ---------------------------------------------------------------------------
  // Register HelloController to handle HTTP requests to /hello
  // NestJS will scan this controller for route decorators and register routes
  controllers: [HelloController],

  // ---------------------------------------------------------------------------
  // Providers Registration
  // ---------------------------------------------------------------------------
  // Register HelloService as a provider for dependency injection
  // NestJS will automatically instantiate and inject it where needed
  providers: [HelloService],

  // ---------------------------------------------------------------------------
  // Exports Configuration
  // ---------------------------------------------------------------------------
  // Export HelloService to make it available to other modules
  // This is optional - remove if HelloService should be module-private
  exports: [HelloService],
})
export class HelloModule {}
