# Infrastructure Documentation

## Overview

This directory contains infrastructure-related files and scripts for the Node.js Hello World application. The infrastructure is intentionally minimal to align with the project's educational purpose and simplicity goals. The design focuses on clarity and ease of understanding, avoiding unnecessary complexity while demonstrating fundamental infrastructure concepts for a Node.js web service.

## Directory Structure

The infrastructure directory is organized to separate different aspects of the application's infrastructure:

### local/

Contains Docker Compose configuration for local development environment. This provides a consistent and isolated environment for development and testing without affecting your host system setup.

### scripts/

Contains utility scripts for setup, health checking, and server management. These scripts automate common tasks and ensure consistent configuration and operation of the application.

## Development Environment

### Prerequisites

To work with this application, you'll need:

- Node.js 18.x LTS (required)
- npm 8.x+ (included with Node.js)
- Git 2.x+ (optional, for version control)
- Docker and Docker Compose (optional, for containerized development)

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
3. Run the setup script to install dependencies and verify prerequisites:

```bash
./infrastructure/scripts/setup.sh
```

The setup script will:
- Check your Node.js and npm versions
- Install project dependencies
- Set up default environment variables if needed
- Ensure the default port (3000) is available

## Deployment Options

This application can be deployed in several ways, from simplest to more complex:

### Local Execution

The simplest deployment option is to run the application directly on your local machine:

```bash
# From project root
./infrastructure/scripts/start-server.sh

# Or using npm
npm start
```

**Advantages:**
- Simplest setup with no additional tools required
- Direct access to logs and debugging information
- Immediate feedback during development

### Docker Deployment

For containerized deployment, which provides better isolation and consistency:

```bash
# Build the Docker image
docker build -t nodejs-hello-world .

# Run the container
docker run -p 3000:3000 nodejs-hello-world
```

**Advantages:**
- Consistent environment regardless of host system
- Isolation from host system dependencies
- Easy to distribute and deploy to different environments

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
| PM2 | Node.js process management | `pm2 start src/server.js --name "hello-world"` |
| systemd | System service management | Create a unit file in `/etc/systemd/system/` |
| Docker | Containerization | Use the provided Dockerfile |

## Utility Scripts

The infrastructure/scripts directory contains utility scripts to simplify common tasks:

### setup.sh

Automates the initial setup process for the application.

**Functions:**
- Checks Node.js and npm versions against requirements
- Installs dependencies
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

Starts the server with proper configuration and error handling.

**Functions:**
- Configures environment variables for the server
- Starts the server in foreground or background mode
- Verifies server startup with health check
- Handles errors and provides feedback

**Usage:**
```bash
./infrastructure/scripts/start-server.sh [-p port] [-e environment] [-d]
```
Where `-d` starts the server in detached (background) mode.

## Docker Configuration

### Dockerfile

The Dockerfile defines how the application is containerized:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**Key Features:**
- Uses lightweight Alpine Linux base image
- Installs only production dependencies
- Optimizes layers for better caching
- Configures environment variables
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

- Keep Node.js updated to the latest LTS version
- Regularly check for security advisories
- Update dependencies if any are added in the future (the core application intentionally has no external dependencies)

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
| "Cannot find module" error | Missing dependencies | Run setup.sh script |
| EACCES error | Permission issues | Check file permissions or use port >1024 |

## Resources

Additional resources for infrastructure management:

- [Node.js documentation](https://nodejs.org/docs/latest-v18.x/api/)
- [Docker documentation](https://docs.docker.com/)
- [PM2 documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)