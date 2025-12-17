# Infrastructure Documentation

## Overview

This directory contains infrastructure-related files and scripts for the NestJS Hello World application. The infrastructure is intentionally minimal to align with the project's educational purpose and simplicity goals. The application is built with the TypeScript-based NestJS framework, providing a modern, enterprise-grade foundation while maintaining simplicity. The design focuses on clarity and ease of understanding, avoiding unnecessary complexity while demonstrating fundamental infrastructure concepts for a NestJS web service.

## Directory Structure

The infrastructure directory is organized to separate different aspects of the application's infrastructure:

### local/

Contains Docker Compose configuration for local development environment. This provides a consistent and isolated environment for development and testing without affecting your host system setup.

### scripts/

Contains utility scripts for setup, health checking, and server management. These scripts automate common tasks and ensure consistent configuration and operation of the application.

## Development Environment

### Prerequisites

To work with this application, you'll need:

- Node.js 18.x or higher (required for NestJS 11)
- npm 9.x+ (included with Node.js)
- Git 2.x+ (optional, for version control)
- Docker and Docker Compose (optional, for containerized development)
- NestJS CLI (optional, globally installed for code generation: `npm install -g @nestjs/cli`)
- TypeScript knowledge (helpful for development and understanding the codebase)

#### Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| Memory | 128MB RAM | 256MB RAM |
| Disk Space | 50MB | 100MB |
| Network | Port 3000 available | Port configurable via environment |

### Local Setup

To set up your local development environment:

1. Clone the repository to your local machine
2. Navigate to the project root directory
3. Run the setup script to install dependencies, compile TypeScript, and verify prerequisites:

```bash
./infrastructure/scripts/setup.sh
```

The setup script will:
- Check your Node.js and npm versions (Node.js 18+ required)
- Install NestJS CLI globally (`npm install -g @nestjs/cli`)
- Install project dependencies in `src/backend`
- Compile TypeScript source (`npm run build`)
- Set up default environment variables if needed
- Ensure the default port (3000) is available

## Deployment Options

This application can be deployed in several ways, from simplest to more complex:

### Local Execution

The simplest deployment option is to run the application directly on your local machine:

```bash
# From project root (development mode with hot-reload)
./infrastructure/scripts/start-server.sh

# Or using npm in src/backend directory
cd src/backend
npm run start:dev    # Development with watch mode and hot-reload
npm run start:prod   # Production mode (requires build first)
npm run start        # Standard start
```

**Advantages:**
- Simplest setup with no additional tools required
- Direct access to logs and debugging information
- TypeScript hot-reload in development mode for immediate feedback
- Watch mode automatically recompiles on file changes

### Docker Deployment

For containerized deployment, which provides better isolation and consistency:

```bash
# Build the Docker image (includes TypeScript compilation)
docker build -t nestjs-hello-world .

# Run the container
docker run -p 3000:3000 nestjs-hello-world
```

> **Note:** The Dockerfile uses a multi-stage build process that compiles TypeScript during the build stage and runs the compiled JavaScript in the production stage for optimal performance and smaller image size.

**Advantages:**
- Consistent environment regardless of host system
- Isolation from host system dependencies
- Easy to distribute and deploy to different environments
- Multi-stage build ensures production-only dependencies in final image

### Platform as a Service (PaaS)

For educational purposes, this application can be deployed to various PaaS providers:

> **Note:** PaaS deployment is mentioned for educational purposes. For a simple application like this, local deployment is typically sufficient.

- Many PaaS providers offer free tiers suitable for this application
- Deployment typically involves connecting to a Git repository
- Environment variables (like PORT) can be configured through the provider's interface

### Virtual Private Server (VPS)

For a more production-like setup, you can deploy to a VPS:

1. Set up a VPS with SSH access
2. Install Node.js and Git
3. Clone the repository
4. Run the setup script
5. Configure a process manager (see options below)
6. Start the application

#### Process Management Options

| Tool | Purpose | Basic Configuration |
|------|---------|---------------------|
| PM2 | Node.js process management | `pm2 start dist/main.js --name "hello-world"` |
| systemd | System service management | Create a unit file in `/etc/systemd/system/` |
| Docker | Containerization | Use the provided multi-stage Dockerfile |

> **Note:** For production deployments, always use `npm run start:prod` or run the compiled JavaScript directly from `dist/main.js`. Ensure TypeScript is compiled first with `npm run build`.

## Utility Scripts

The infrastructure/scripts directory contains utility scripts to simplify common tasks:

### setup.sh

Automates the initial setup process for the NestJS application.

**Functions:**
- Checks Node.js (18+) and npm versions against requirements
- Installs NestJS CLI globally for code generation
- Installs dependencies in `src/backend` directory
- Compiles TypeScript source code (`npm run build`)
- Sets up environment variables if not already configured
- Checks port availability

**Usage:**
```bash
./infrastructure/scripts/setup.sh
```

### health-check.sh

Verifies that the server is running correctly by testing a health endpoint. Defaults to `/health` for the dedicated health check endpoint.

**Functions:**
- Makes HTTP requests to the health endpoint (defaults to /health)
- Verifies the response status code and content
- Supports configurable retries and intervals
- Can be used in monitoring systems

**Usage:**
```bash
./infrastructure/scripts/health-check.sh [-h host] [-p port] [-r retries] [-i interval]
```

### start-server.sh

Starts the NestJS server with proper configuration and error handling.

**Functions:**
- Configures environment variables for the NestJS server
- Starts the server using NestJS npm scripts (`start:dev` or `start:prod`)
- Manages PID file for process tracking
- Supports foreground and background (detached) mode
- Handles errors and provides feedback

**Usage:**
```bash
./infrastructure/scripts/start-server.sh [-p port] [-e environment] [-d]
```
Where `-d` starts the server in detached (background) mode.

> **Note:** This script should be run from the project root directory. It will navigate to `src/backend` to execute npm scripts.

## Docker Configuration

### Dockerfile

The Dockerfile uses a multi-stage build to compile TypeScript and create an optimized production image:

```dockerfile
# Build stage - compile TypeScript
FROM node:18-alpine AS builder
WORKDIR /app
COPY src/backend/package*.json ./
RUN npm ci
COPY src/backend/ ./
RUN npm run build

# Production stage - run compiled JavaScript
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Key Features:**
- Multi-stage build for optimized image size
- TypeScript compilation occurs in the build stage
- Production-only runtime dependencies in final image
- Runs compiled JavaScript for optimal performance
- Uses lightweight Alpine Linux base image
- Configures environment variables for production
- Exposes the default port

### Docker Compose

For local development with Docker, a Docker Compose configuration is provided in the `infrastructure/local` directory:

**Key Features:**
- Development-focused configuration
- Volume mounting for live code changes
- Health checking integration
- Network configuration for multi-container setups (if needed in the future)

> **Note:** The Docker Compose health check uses the dedicated `/health` endpoint for container health verification.

**Usage:**
```bash
# From infrastructure/local directory
docker-compose up -d
```

## Maintenance

### Updates

To keep the application running smoothly:

- Keep Node.js updated to the latest LTS version (18.x or higher for NestJS 11)
- Keep TypeScript updated to maintain compatibility with NestJS
- Run `npm run build` after TypeScript source changes to recompile
- Regularly check for security advisories in NestJS and its dependencies
- Update NestJS and related dependencies regularly (`npm update` in `src/backend`)
- Review NestJS release notes when upgrading major versions

### Monitoring

For this simple application, monitoring can be:

- Console logging for educational purposes
- Regular execution of the health-check.sh script
- Monitoring of process exit codes to detect failures

For production use, additional monitoring would be required but is beyond the scope of this educational example.

### Health Check Endpoints

The application provides dedicated endpoints for health verification:

| Endpoint | Response | Purpose |
|----------|----------|---------|
| `/health` | 200 OK (empty body) | Recommended for health checks - optimized for health verification with minimal overhead |
| `/hello` | 200 OK with "Hello world" | Primary application endpoint - can be used for health checks but `/health` is semantically appropriate |

**Best Practices:**
- Use `/health` for container health checks (Docker, Kubernetes)
- Use `/health` for load balancer health verification
- Use `/health` for monitoring systems and uptime checks
- The `/health` endpoint returns an empty body, making it efficient for frequent polling

### Troubleshooting

Common issues and their solutions:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Server won't start | Port already in use | Change PORT environment variable |
| Connection refused | Server not running | Ensure server is started |
| "Cannot find module" error | Missing dependencies | Run `npm install` in `src/backend` then `npm run build` |
| EACCES error | Permission issues | Check file permissions or use port >1024 |
| TypeScript compilation fails | Type errors or missing dependencies | Run `npm install` then `npm run build` to see detailed errors |
| Cannot find module in dist/ | dist/ not built | Run `npm run build` to compile TypeScript |
| Decorator errors | Missing reflect-metadata | Ensure `reflect-metadata` is imported in `main.ts` |
| NestJS module not found | CLI not installed | Run `npm install -g @nestjs/cli` |
| Watch mode not working | TypeScript not watching | Use `npm run start:dev` for development with watch mode |

## Resources

Additional resources for infrastructure management:

- [NestJS documentation](https://docs.nestjs.com/) - Official NestJS framework documentation
- [TypeScript documentation](https://www.typescriptlang.org/docs/) - TypeScript language reference
- [Node.js documentation](https://nodejs.org/docs/latest-v18.x/api/) - Node.js runtime with TypeScript support
- [Docker documentation](https://docs.docker.com/) - Container deployment and management
- [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) - Node.js process management