/**
 * @fileoverview Root application module for NestJS Hello World application
 *
 * This module serves as the root module for the NestJS application,
 * orchestrating all feature modules and establishing the dependency
 * injection container. It transforms the vanilla Node.js require()
 * imports from index.js into NestJS's modular architecture.
 *
 * @module AppModule
 *
 * @description
 * The AppModule is the entry point for NestJS's dependency injection
 * system. It imports all feature modules and registers root-level
 * components:
 *
 * - AppConfigModule: Environment-based configuration management
 * - HelloModule: The /hello endpoint feature
 * - AppController: Root-level health check endpoint
 * - AppService: Root-level application services
 *
 * This module replaces the vanilla Node.js pattern where index.js
 * manually required and orchestrated all modules. NestJS handles
 * module initialization order and dependency resolution automatically.
 *
 * Module initialization order:
 * 1. AppConfigModule loads environment configuration
 * 2. HelloModule initializes with its controller and service
 * 3. AppController and AppService are registered at root level
 * 4. All routes are registered with the HTTP server
 *
 * @author Blitzy Platform
 * @created 2024
 *
 * @see {@link https://docs.nestjs.com/modules NestJS Modules}
 * @see {@link https://docs.nestjs.com/modules#global-modules NestJS Global Modules}
 *
 * @example
 * // Used in main.ts to bootstrap the application
 * const app = await NestFactory.create(AppModule);
 * await app.listen(3000);
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================
 * Organized by source: NestJS framework, feature modules, root components
 * ============================================================================ */

// -----------------------------------------------------------------------------
// NestJS Framework Imports
// -----------------------------------------------------------------------------
// Core module decorator for defining NestJS modules
import { Module } from '@nestjs/common';

// -----------------------------------------------------------------------------
// Feature Module Imports
// -----------------------------------------------------------------------------
// Application feature modules providing specific functionality
import { AppConfigModule } from './config/config.module';
import { HelloModule } from './hello/hello.module';

// -----------------------------------------------------------------------------
// Root Component Imports
// -----------------------------------------------------------------------------
// Root-level controller and service for application-level functionality
import { AppController } from './app.controller';
import { AppService } from './app.service';

/* ============================================================================
 * APP MODULE CLASS
 * ============================================================================
 * Root application module orchestrating all feature modules
 * ============================================================================ */

/**
 * Root application module for the NestJS Hello World application
 *
 * @class AppModule
 *
 * @description
 * This is the root module of the NestJS application. It orchestrates
 * all feature modules and registers root-level providers and controllers.
 * The module replaces the manual module orchestration from the vanilla
 * Node.js index.js with NestJS's declarative module system.
 *
 * The @Module() decorator configuration:
 *
 * - imports: Feature modules to include in the application
 *   * AppConfigModule (FIRST): Configuration must be available first
 *   * HelloModule: The /hello endpoint feature module
 *
 * - controllers: Root-level HTTP controllers
 *   * AppController: Handles root-level routes (e.g., health check)
 *
 * - providers: Root-level services
 *   * AppService: Application-level business logic
 *
 * Original vanilla Node.js transformation:
 * - index.js require('./server') → NestJS internal HTTP server
 * - index.js require('./router') → HelloController routing
 * - index.js require('./config') → AppConfigModule
 * - Manual module exports → NestJS dependency injection
 *
 * Why AppConfigModule is imported first:
 * ConfigModule with isGlobal: true should be imported first to ensure
 * ConfigService is available when other modules initialize. This
 * guarantees environment variables are accessible to all services.
 *
 * @example
 * // Bootstrap the application with this module
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   await app.listen(3000);
 * }
 * bootstrap();
 *
 * @example
 * // Create a testing module
 * const module = await Test.createTestingModule({
 *   imports: [AppModule],
 * }).compile();
 */
@Module({
  // ---------------------------------------------------------------------------
  // Feature Module Imports
  // ---------------------------------------------------------------------------
  // Import feature modules in dependency order
  // ConfigModule should be first to ensure ConfigService is globally available
  imports: [
    // Configuration module - MUST be first for global ConfigService availability
    // Provides environment-based configuration via ConfigService injection
    AppConfigModule,

    // Hello feature module
    // Provides HelloController and HelloService for /hello endpoint
    HelloModule,
  ],

  // ---------------------------------------------------------------------------
  // Root Controllers Registration
  // ---------------------------------------------------------------------------
  // Register root-level controllers for application-level routes
  controllers: [
    // Root application controller for health check and root endpoints
    AppController,
  ],

  // ---------------------------------------------------------------------------
  // Root Providers Registration
  // ---------------------------------------------------------------------------
  // Register root-level services for dependency injection
  providers: [
    // Root application service for application-level business logic
    AppService,
  ],
})
export class AppModule {}
