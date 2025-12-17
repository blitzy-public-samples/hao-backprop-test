# ==============================================================================
# Dockerfile - Multi-Stage Build for NestJS Hello World Application
# ==============================================================================
#
# @fileoverview Multi-stage Docker build configuration for NestJS TypeScript application
# @description This Dockerfile implements a multi-stage build pattern optimized for
#              NestJS applications written in TypeScript. The multi-stage approach
#              provides several key benefits:
#
#              1. SMALLER FINAL IMAGE: Development dependencies (TypeScript compiler,
#                 build tools, etc.) are only present in the build stage and not
#                 included in the final production image.
#
#              2. SECURITY: The production image contains only runtime dependencies,
#                 reducing the attack surface by excluding build tools and dev packages.
#
#              3. LAYER CACHING: Dependencies are installed before copying source code,
#                 enabling Docker to cache the dependency layer. This significantly
#                 speeds up subsequent builds when only source code changes.
#
#              4. SEPARATION OF CONCERNS: Build process is clearly separated from
#                 runtime configuration, making the Dockerfile easier to maintain.
#
# @author Blitzy Platform
# @version 1.0.0
# @see https://docs.nestjs.com/
# ==============================================================================

# ==============================================================================
# STAGE 1: BUILDER
# ==============================================================================
# Purpose: Compile TypeScript source code to JavaScript
# This stage installs ALL dependencies (including devDependencies) needed to:
#   - Compile TypeScript to JavaScript using the NestJS CLI
#   - Run any build-time transformations or optimizations
#   - Generate the production-ready dist/ folder
#
# The resulting dist/ folder will be copied to the production stage.
# ==============================================================================

FROM node:18-alpine AS builder

# Add metadata labels for the builder stage
# These labels help identify the build stage in multi-stage builds
LABEL stage="builder"
LABEL description="NestJS TypeScript compilation stage"

# Set the working directory for the build process
# All subsequent commands will be executed relative to this directory
WORKDIR /app

# ------------------------------------------------------------------------------
# DEPENDENCY INSTALLATION LAYER
# ------------------------------------------------------------------------------
# Copy package files FIRST before source code to leverage Docker layer caching.
# When package.json doesn't change, Docker reuses the cached dependency layer,
# dramatically speeding up builds when only source code is modified.
#
# We use 'npm ci' instead of 'npm install' because:
#   - It's faster and more reliable for CI/CD environments
#   - It uses package-lock.json for deterministic installs
#   - It removes any existing node_modules before installing
# ------------------------------------------------------------------------------

# Copy package manifest files from the backend source directory
COPY src/backend/package*.json ./

# Install ALL dependencies including devDependencies
# DevDependencies are required for TypeScript compilation (typescript, @nestjs/cli, etc.)
# The 'npm ci' command ensures a clean, reproducible installation
RUN npm ci

# ------------------------------------------------------------------------------
# SOURCE CODE COMPILATION LAYER
# ------------------------------------------------------------------------------
# Copy the entire backend source code including:
#   - src/ directory with TypeScript source files
#   - TypeScript configuration files (tsconfig.json, tsconfig.build.json)
#   - NestJS CLI configuration (nest-cli.json)
#   - Any other build-time configuration files
# ------------------------------------------------------------------------------

# Copy all source code and configuration files
COPY src/backend/ ./

# Compile TypeScript to JavaScript
# This runs the NestJS build command which:
#   - Reads tsconfig.build.json for compilation settings
#   - Compiles all .ts files to .js in the dist/ directory
#   - Generates source maps for debugging (if configured)
#   - Handles path aliases and module resolution
RUN npm run build

# ==============================================================================
# STAGE 2: PRODUCTION
# ==============================================================================
# Purpose: Create a minimal, secure production image
# This stage creates the final Docker image that will be deployed.
# It contains ONLY what's needed to run the application:
#   - Node.js runtime
#   - Production dependencies (no devDependencies)
#   - Compiled JavaScript code (no TypeScript source)
#
# Benefits of this approach:
#   - Image size reduced by ~60-70% compared to including build tools
#   - Faster container startup times
#   - Reduced security vulnerabilities from fewer packages
#   - Cleaner, more focused runtime environment
# ==============================================================================

FROM node:18-alpine AS production

# ------------------------------------------------------------------------------
# IMAGE METADATA LABELS
# ------------------------------------------------------------------------------
# Labels provide metadata about the image for documentation, automation,
# and container management tools like Docker Hub, Kubernetes, etc.
# Following OCI (Open Container Initiative) label standards where applicable.
# ------------------------------------------------------------------------------

LABEL maintainer="Blitzy Platform"
LABEL org.opencontainers.image.title="Hello World NestJS API"
LABEL org.opencontainers.image.description="A production-ready Hello World HTTP API built with NestJS framework"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Blitzy"
LABEL org.opencontainers.image.source="https://github.com/blitzy/hello-world-nestjs"
LABEL org.opencontainers.image.licenses="MIT"

# Set the working directory for the production application
WORKDIR /app

# ------------------------------------------------------------------------------
# PRODUCTION DEPENDENCY INSTALLATION
# ------------------------------------------------------------------------------
# Install ONLY production dependencies to minimize image size and attack surface.
# We copy package files from the builder stage to ensure consistency.
#
# The '--only=production' flag (or '--omit=dev' in npm 8+) ensures that:
#   - TypeScript compiler is NOT installed
#   - Build tools are NOT installed
#   - Test frameworks are NOT installed
#   - Only runtime dependencies are present
# ------------------------------------------------------------------------------

# Copy package manifest files from the builder stage
# This ensures we use the exact same package versions that were built against
COPY --from=builder /app/package*.json ./

# Install only production dependencies
# Using 'npm ci' for clean, reproducible installs in production
RUN npm ci --only=production && \
    # Clean npm cache to reduce image size
    npm cache clean --force && \
    # Remove any unnecessary files
    rm -rf /tmp/*

# ------------------------------------------------------------------------------
# APPLICATION CODE LAYER
# ------------------------------------------------------------------------------
# Copy ONLY the compiled JavaScript from the builder stage.
# This excludes:
#   - TypeScript source files (.ts)
#   - Test files (.spec.ts, .e2e-spec.ts)
#   - Development configuration files
#   - Build artifacts and intermediate files
# ------------------------------------------------------------------------------

# Copy the compiled dist/ folder from the builder stage
# This contains all the JavaScript files needed to run the application
COPY --from=builder /app/dist ./dist

# ------------------------------------------------------------------------------
# ENVIRONMENT CONFIGURATION
# ------------------------------------------------------------------------------
# Set environment variables for the production runtime.
# These can be overridden at container runtime using -e or --env flags.
# ------------------------------------------------------------------------------

# Set the port the application will listen on
# Default: 3000 (standard NestJS default)
ENV PORT=3000

# Set Node.js environment to production mode
# This enables production optimizations in NestJS and Express:
#   - Disables development-only middleware
#   - Enables response caching where applicable
#   - Reduces verbose logging
ENV NODE_ENV=production

# ------------------------------------------------------------------------------
# NETWORKING CONFIGURATION
# ------------------------------------------------------------------------------
# EXPOSE documents which ports the container listens on at runtime.
# This is documentation only - it doesn't actually publish the port.
# Use 'docker run -p' to publish ports when running the container.
# ------------------------------------------------------------------------------

# Document that the application listens on port 3000
EXPOSE 3000

# ------------------------------------------------------------------------------
# HEALTH CHECK CONFIGURATION
# ------------------------------------------------------------------------------
# HEALTHCHECK enables Docker to monitor the container's health status.
# This is essential for:
#   - Container orchestration (Docker Swarm, Kubernetes)
#   - Load balancer health monitoring
#   - Automated container restart on failure
#
# Configuration:
#   --interval=30s : Check health every 30 seconds
#   --timeout=3s   : Wait up to 3 seconds for a response
#   --start-period=5s : Grace period for container startup
#   --retries=3    : Mark unhealthy after 3 consecutive failures
#
# The wget command:
#   --no-verbose   : Suppress progress output
#   --tries=1      : Only try once per health check
#   --spider       : Don't download, just check if resource exists
# ------------------------------------------------------------------------------

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/hello || exit 1

# ------------------------------------------------------------------------------
# CONTAINER STARTUP COMMAND
# ------------------------------------------------------------------------------
# Define the command to run when the container starts.
# Using the exec form (JSON array) instead of shell form because:
#   - Signals are properly passed to the Node.js process (for graceful shutdown)
#   - No shell process wrapping the Node process
#   - More predictable behavior across different base images
#
# The entry point is dist/main.js, which is the compiled NestJS bootstrap file.
# This file:
#   - Creates the NestJS application instance
#   - Configures middleware and filters
#   - Starts the HTTP server
#   - Handles graceful shutdown on SIGTERM/SIGINT
# ------------------------------------------------------------------------------

CMD ["node", "dist/main"]
